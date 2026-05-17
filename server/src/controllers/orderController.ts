import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '../services/emailService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16', // using a fixed api version
});

// Helper: Ensure we have a valid session ID from cookie
const getSessionId = (req: Request): string => {
  return req.cookies.cartSessionId || '';
};

export const getStripeConfig = (_req: Request, res: Response) => {
  return ApiResponse.success(res, {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
};

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = getSessionId(req);
    const query = req.user ? { user: req.user.id } : { sessionId };
    
    const cart = await Cart.findOne(query).populate('items.product', 'name price stock');
    if (!cart || cart.items.length === 0) {
      return next(new AppError('Cart is empty', 400));
    }

    // Verify all items are still in stock
    for (const item of cart.items) {
      const product = item.product as any;
      if (!product || product.stock < item.quantity) {
        return next(new AppError(`Product ${item.name} does not have enough stock`, 400));
      }
    }

    // Force total calculation (incase of malicious modification or outdated snapshot)
    let subtotal = 0;
    const orderItems = cart.items.map((item: any) => {
      subtotal += item.product.price * item.quantity;
      return {
        product: item.product._id,
        name: item.name,
        price: item.product.price, // use live price
        quantity: item.quantity,
        image: item.image,
        variant: item.variant,
      };
    });

    let discount = 0;
    if (cart.appliedVoucher) {
      await cart.populate('appliedVoucher');
      const voucher: any = cart.appliedVoucher;
      const validation = await voucher.isValid(req.user?.id, subtotal);
      if (validation.valid) {
        if (voucher.discountType === 'percentage') {
          discount = subtotal * (voucher.discountValue / 100);
          if (voucher.maxDiscount) discount = Math.min(discount, voucher.maxDiscount);
        } else if (voucher.discountType === 'fixed') {
          discount = voucher.discountValue;
        }
      }
    }

    const shippingFee = subtotal - discount > 100 ? 0 : 10; // Simple shipping logic
    const tax = (subtotal - discount) * 0.05; // 5% tax
    const total = subtotal - discount + shippingFee + tax;

    // Create Order in DB (status pending)
    const order = await Order.create({
      user: req.user ? req.user.id : undefined,
      sessionId: req.user ? undefined : sessionId,
      items: orderItems,
      shippingAddress: req.body.shippingAddress,
      billingAddress: req.body.billingAddress || req.body.shippingAddress,
      subtotal,
      discount,
      shippingFee,
      tax,
      total,
      appliedVoucher: cart.appliedVoucher,
      paymentMethod: 'card',
      paymentStatus: 'pending',
      orderStatus: 'pending',
    });

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Stripe expects cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
      },
    });

    order.paymentIntentId = paymentIntent.id;
    await order.save({ validateBeforeSave: false });

    return ApiResponse.success(res, { 
      orderId: order._id,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    next(error);
  }
};

export const stripeWebhook = async (req: Request, res: Response, _next: NextFunction) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    // req.body MUST be a raw buffer here, configured in app.ts before express.json
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error('Stripe webhook signature error', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error('No orderId in payment intent metadata');
      return res.json({ received: true });
    }

    try {
      const order = await Order.findById(orderId);
      if (!order) throw new Error('Order not found');
      
      if (order.paymentStatus === 'paid') {
        // Already processed
        return res.json({ received: true });
      }

      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', note: 'Payment received via Stripe', timestamp: new Date() });
      await order.save();

      // Deduct stock for each item atomically
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      }

      // Clear the cart
      const cartQuery = order.user ? { user: order.user } : { sessionId: order.sessionId };
      await Cart.findOneAndDelete(cartQuery);

      // Send Order Confirmation Email async (not blocking webhook)
      // Attempt to get email if user exists, else from order shipping address email if collected (assuming populated)
      if (order.user) {
        const user = await mongoose.model('User').findById(order.user);
        if (user) {
          sendOrderConfirmation(user.email, order).catch(e => console.error(e));
        }
      }

    } catch (error) {
      console.error('Operation failed during webhook:', error);
      return res.status(500).json({ error: 'Operation failed' });
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'failed',
      });
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
};

// Alternative to webhook: Frontend calls this after stripe.confirmCardPayment succeeds
export const confirmOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, paymentIntentId, mockPayment } = req.body;
    
    if (!orderId || (!paymentIntentId && !mockPayment)) {
      return next(new AppError('Please provide orderId and paymentIntentId', 400));
    }

    // In development, allow skipping Stripe verification for easy manual testing
    if (process.env.NODE_ENV === 'development' && mockPayment) {
      console.log('Skipping Stripe verification for manual testing...');
    } else {
      // Verify with Stripe directly
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        return next(new AppError(`Payment not successful. Status: ${paymentIntent.status}`, 400));
      }
    }

    try {
      const order = await Order.findById(orderId);
      if (!order) throw new Error('Order not found');
      
      // Verify intent belongs to this order
      if (order.paymentIntentId !== paymentIntentId && !mockPayment) {
        throw new Error('Payment intent mismatch');
      }
      
      if (order.paymentStatus === 'paid') {
        // Already processed via webhook or duplicate call
        return ApiResponse.success(res, { order }, 'Order already confirmed');
      }

      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', note: 'Payment verified via manual confirmation', timestamp: new Date() });
      await order.save();

      // Deduct stock for each item atomically
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      }

      // Clear the cart
      const cartQuery = order.user ? { user: order.user } : { sessionId: order.sessionId };
      await Cart.findOneAndDelete(cartQuery);

      // Send Order Confirmation Email async
      if (order.user) {
        const user = await mongoose.model('User').findById(order.user);
        if (user) {
          sendOrderConfirmation(user.email, order).catch(e => console.error(e));
        }
      }

      return ApiResponse.success(res, { order }, 'Order confirmed successfully');
    } catch (error) {
      console.error('Operation failed during manual confirmation:', error);
      return next(new AppError('Operation failed during confirmation', 500));
    }
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('items.product', 'name images slug');

    if (!order) return next(new AppError('Order not found', 404));

    // Verify ownership or admin
    if (req.user?.role !== 'admin') {
      if (order.user && order.user.toString() !== req.user?.id) {
        return next(new AppError('Not authorized to view this order', 403));
      }
      if (!order.user && order.sessionId !== getSessionId(req)) {
        return next(new AppError('Not authorized to view this order', 403));
      }
    }

    return ApiResponse.success(res, { order });
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user!.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ user: req.user!.id });

    return ApiResponse.success(res, { orders }, 'User orders retrieved', 200, {
      total, page, pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search, page, limit } = req.query;
    const query: any = {};

    if (status) query.orderStatus = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.firstName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.lastName': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
    const total = await Order.countDocuments(query);

    return ApiResponse.success(res, { orders }, 'All orders', 200, {
      total, page: pageNum, pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, note, trackingNumber, trackingUrl } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return next(new AppError('Order not found', 404));

    // Simple status transition validation map
    const statusMap: any = {
      pending: 1,
      confirmed: 2,
      processing: 3,
      shipped: 4,
      delivered: 5,
      cancelled: 6,
      refunded: 7,
    };

    if (statusMap[status] <= statusMap[order.orderStatus]) {
      // unless we are updating notes or cancelling/refunding
      if (status !== 'cancelled' && status !== 'refunded') {
        return next(new AppError(`Cannot move order status from ${order.orderStatus} to ${status}`, 400));
      }
    }

    order.orderStatus = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (trackingUrl) order.trackingUrl = trackingUrl;

    order.statusHistory.push({
      status,
      note: note || `Order status updated to ${status} by admin`,
      timestamp: new Date()
    });

    await order.save();

    // Send email async
    if (order.user) {
      const user = await mongoose.model('User').findById(order.user);
      if (user) {
        sendOrderStatusUpdate(user.email, order, status).catch(e => console.error(e));
      }
    }

    return ApiResponse.success(res, { order }, 'Order status updated');
  } catch (error) {
    next(error);
  }
};

export const getOrderStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    const totalStats = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalOrders: { $sum: 1 } } }
    ]);

    const pendingOrdersCount = await Order.countDocuments({ orderStatus: 'pending' });

    const revenueByDay = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return ApiResponse.success(res, {
      totalRevenue: totalStats[0]?.totalRevenue || 0,
      totalOrders: totalStats[0]?.totalOrders || 0,
      pendingOrders: pendingOrdersCount,
      revenueByDay
    });
  } catch (error) {
    next(error);
  }
};
