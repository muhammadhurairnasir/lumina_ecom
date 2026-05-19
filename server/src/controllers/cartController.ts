import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Cart from '../models/Cart';
import Product from '../models/Product';
import Voucher from '../models/Voucher';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

// Helper: Ensure we have a valid session ID from cookie
const getSessionId = (req: Request, res: Response): string => {
  let sessionId = req.cookies.cartSessionId;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    res.cookie('cartSessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
  return sessionId;
};

// Helper: Find cart by user ID or session ID
const findCart = async (req: Request, sessionId: string) => {
  if (req.user) {
    return Cart.findOne({ user: req.user.id });
  }
  return Cart.findOne({ sessionId });
};

// Helper: Create a new cart
const createCart = async (req: Request, sessionId: string) => {
  return Cart.create({
    user: req.user ? req.user.id : undefined,
    sessionId: req.user ? undefined : sessionId,
    items: [],
  });
};

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = getSessionId(req, res);
    let cart = await findCart(req, sessionId);

    if (!cart) {
      cart = await createCart(req, sessionId);
    }

    // Populate products to get latest price/name (optional if we strictly rely on snapshot, but good for UI)
    await cart.populate('items.product', 'name slug images price stock');

    return ApiResponse.success(res, { cart });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, slug, quantity, variant } = req.body;
    const qty = Number(quantity) || 1;

    let product = await Product.findById(productId);
    if (!product && slug) {
      product = await Product.findOne({ slug });
    }

    if (!product || !product.isActive) {
      return next(new AppError('Product not found or inactive', 404));
    }

    if (product.stock < qty) {
      return next(new AppError(`Only ${product.stock} items left in stock`, 400));
    }

    const sessionId = getSessionId(req, res);
    let cart = await findCart(req, sessionId);

    if (!cart) {
      cart = await createCart(req, sessionId);
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === product._id.toString() && item.variant === variant
    );

    if (itemIndex > -1) {
      // Item exists, check total stock limit
      if (cart.items[itemIndex].quantity + qty > product.stock) {
        return next(new AppError('Cannot add more than available stock', 400));
      }
      cart.items[itemIndex].quantity += qty;
    } else {
      // New item
      cart.items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: qty,
        image: product.images[0]?.url,
        variant,
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name slug images price stock');

    return ApiResponse.success(res, { cart }, 'Item added to cart');
  } catch (error) {
    next(error);
  }
};

export const updateQuantity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const { quantity, variant } = req.body;
    const qty = Number(quantity);

    if (qty < 1) return next(new AppError('Quantity must be at least 1', 400));

    const sessionId = getSessionId(req, res);
    const cart = await findCart(req, sessionId);

    if (!cart) return next(new AppError('Cart not found', 404));

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.variant === variant
    );

    if (itemIndex === -1) return next(new AppError('Item not in cart', 404));

    const product = await Product.findById(productId);
    if (!product || product.stock < qty) {
      return next(new AppError('Requested quantity exceeds available stock', 400));
    }

    cart.items[itemIndex].quantity = qty;
    await cart.save();
    await cart.populate('items.product', 'name slug images price stock');

    return ApiResponse.success(res, { cart }, 'Cart updated');
  } catch (error) {
    next(error);
  }
};

export const removeItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const variant = req.query.variant as string;

    const sessionId = getSessionId(req, res);
    const cart = await findCart(req, sessionId);

    if (!cart) return next(new AppError('Cart not found', 404));

    cart.items = cart.items.filter(
      (item) => !(item.product.toString() === productId && item.variant === variant)
    );

    await cart.save();
    await cart.populate('items.product', 'name slug images price stock');

    return ApiResponse.success(res, { cart }, 'Item removed from cart');
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = getSessionId(req, res);
    const cart = await findCart(req, sessionId);

    if (cart) {
      cart.items = [];
      cart.appliedVoucher = undefined;
      cart.discount = 0;
      await cart.save();
    }

    return ApiResponse.success(res, { cart }, 'Cart cleared');
  } catch (error) {
    next(error);
  }
};

export const applyVoucher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    
    const sessionId = getSessionId(req, res);
    const cart = await findCart(req, sessionId);

    if (!cart || cart.items.length === 0) {
      return next(new AppError('Cannot apply voucher to empty cart', 400));
    }

    const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true });
    if (!voucher) return next(new AppError('Invalid voucher code', 404));

    // Force recalculation of subtotal first to check min order value
    let subtotal = 0;
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (product) subtotal += product.price * item.quantity;
    }

    const userId = req.user ? req.user.id : undefined;
    const validation = await voucher.isValid(userId, subtotal);
    
    if (!validation.valid) {
      return next(new AppError(validation.reason || 'Invalid voucher', 400));
    }

    cart.appliedVoucher = voucher._id as any;
    await cart.save(); // pre-save hook will calculate the actual discount
    await cart.populate('appliedVoucher', 'code discountType discountValue');

    return ApiResponse.success(res, { cart }, 'Voucher applied');
  } catch (error) {
    next(error);
  }
};

export const removeVoucher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = getSessionId(req, res);
    const cart = await findCart(req, sessionId);

    if (cart) {
      cart.appliedVoucher = undefined;
      await cart.save();
    }

    return ApiResponse.success(res, { cart }, 'Voucher removed');
  } catch (error) {
    next(error);
  }
};

// Merge guest cart to user cart upon login
export const mergeGuestCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('Must be logged in to merge cart', 401));

    const sessionId = req.cookies.cartSessionId;
    if (!sessionId) {
      // Nothing to merge
      return ApiResponse.success(res, null, 'No guest cart found');
    }

    const guestCart = await Cart.findOne({ sessionId });
    if (!guestCart || guestCart.items.length === 0) {
      return ApiResponse.success(res, null, 'Guest cart is empty');
    }

    let userCart = await Cart.findOne({ user: req.user.id });
    if (!userCart) {
      userCart = await createCart(req, '');
    }

    // Merge items, highest quantity wins
    for (const guestItem of guestCart.items) {
      const itemIndex = userCart.items.findIndex(
        (item) => item.product.toString() === guestItem.product.toString() && item.variant === guestItem.variant
      );

      if (itemIndex > -1) {
        userCart.items[itemIndex].quantity = Math.max(userCart.items[itemIndex].quantity, guestItem.quantity);
      } else {
        userCart.items.push(guestItem);
      }
    }

    // Prefer guest voucher if present and user has none
    if (guestCart.appliedVoucher && !userCart.appliedVoucher) {
      userCart.appliedVoucher = guestCart.appliedVoucher;
    }

    await userCart.save();
    await userCart.populate('items.product', 'name slug images price stock');
    
    // Delete guest cart
    await Cart.findByIdAndDelete(guestCart._id);
    
    // Clear the guest session cookie
    res.clearCookie('cartSessionId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return ApiResponse.success(res, { cart: userCart }, 'Carts merged successfully');
  } catch (error) {
    next(error);
  }
};
