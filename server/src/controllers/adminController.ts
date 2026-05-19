import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import Category from '../models/Category';
import Voucher from '../models/Voucher';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { generateProductSEO } from '../services/aiService';
import redisClient from '../config/redis';
import SeasonalRule from '../models/SeasonalRule';
import { getForecastForAllProducts, calculateStockForecast } from '../services/stockForecastService';

const REVENUE_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'];
const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;

const parseProductPayload = (body: Record<string, unknown>) => {
  const payload: Record<string, unknown> = { ...body };

  if (typeof payload.price === 'string') payload.price = parseFloat(payload.price as string);
  if (typeof payload.compareAtPrice === 'string') payload.compareAtPrice = parseFloat(payload.compareAtPrice as string);
  if (typeof payload.stock === 'string') payload.stock = parseInt(payload.stock as string, 10);

  if (typeof payload.seoKeywords === 'string') {
    payload.seoKeywords = (payload.seoKeywords as string)
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  if (typeof payload.images === 'string') {
    try {
      payload.images = JSON.parse(payload.images as string);
    } catch {
      payload.images = (payload.images as string)
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => ({ url, publicId: url, alt: '' }));
    }
  }

  if (Array.isArray(payload.images)) {
    payload.images = payload.images.map((img: unknown) => {
      if (typeof img === 'string') return { url: img, publicId: img, alt: '' };
      const image = img as { url: string; publicId?: string; alt?: string };
      return {
        url: image.url,
        publicId: image.publicId || image.url,
        alt: image.alt || '',
      };
    });
  }

  if (payload.compareAtPrice === '' || payload.compareAtPrice === 0) {
    delete payload.compareAtPrice;
  }

  return payload;
};

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

export const getStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalRevenue, monthRevenue, lastMonthRevenue,
      totalOrders, pendingOrders,
      totalProducts, lowStockCount,
      totalCustomers,
      revenueByDay,
      ordersByStatus,
      topProducts,
    ] = await Promise.all([
      // All-time revenue
      Order.aggregate([
        { $match: { orderStatus: { $in: REVENUE_STATUSES } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // This month revenue
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, orderStatus: { $in: REVENUE_STATUSES } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // Last month revenue
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, orderStatus: { $in: REVENUE_STATUSES } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'pending' }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ stock: { $lt: 10 }, isActive: true }),
      User.countDocuments({ role: 'user' }),
      // Revenue for last 14 days
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
            orderStatus: { $in: REVENUE_STATUSES },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%b %d', date: '$createdAt' } },
            total: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Orders by status
      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Top 5 products by revenue
      Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', name: { $first: '$items.name' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, sold: { $sum: '$items.quantity' } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productDoc' } },
        { $unwind: '$productDoc' },
        { $project: { name: 1, revenue: 1, sold: 1, stock: '$productDoc.stock' } }
      ]),
    ]);

    const rev = totalRevenue[0]?.total || 0;
    const mRev = monthRevenue[0]?.total || 0;
    const lmRev = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = lmRev > 0 ? (((mRev - lmRev) / lmRev) * 100).toFixed(1) : null;

    return ApiResponse.success(res, {
      revenue: { total: rev, thisMonth: mRev, lastMonth: lmRev, growth: revenueGrowth },
      orders: { total: totalOrders, pending: pendingOrders },
      products: { total: totalProducts, lowStock: lowStockCount },
      customers: { total: totalCustomers },
      charts: {
        revenueByDay: revenueByDay.map(d => ({ name: d._id, total: d.total, orders: d.count })),
        ordersByStatus: ordersByStatus.map(d => ({ name: d._id, value: d.count })),
      },
      topProducts,
      stockPredictions: topProducts.map(p => {
        // AI Stock Prediction Algorithm (Heuristic)
        // 1. Calculate Daily Sales Velocity based on last 30 days
        const dailyVelocity = Math.max(0.1, p.sold / 30); // Prevent division by zero
        
        // 2. Predict days until out of stock
        const daysRemaining = Math.floor(p.stock / dailyVelocity);
        
        return {
          id: p._id,
          name: p.name,
          currentStock: p.stock,
          dailyVelocity: parseFloat(dailyVelocity.toFixed(2)),
          estimatedDaysRemaining: daysRemaining,
          status: daysRemaining < 7 ? 'Critical' : daysRemaining < 14 ? 'Warning' : 'Healthy'
        };
      })
    });
  } catch (error) {
    next(error);
  }
};

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { sku: { $regex: search, $options: 'i' } }];
    if (category) query.category = category;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    // Inject AI Forecast into every product
    const productsWithForecast = await Promise.all(products.map(async (p: any) => {
      const recentOrders = await Order.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $unwind: '$items' },
        { $match: { 'items.product': p._id } },
        { $group: { _id: null, sold: { $sum: '$items.quantity' } } }
      ]);
      const sold = recentOrders[0]?.sold || 0;
      const velocity = Math.max(0.1, sold / 30);
      const daysRemaining = Math.floor((p.stock || 0) / velocity);
      
      return {
        ...p,
        aiForecast: {
          velocity: parseFloat(velocity.toFixed(2)),
          daysRemaining,
          status: daysRemaining < 7 ? 'Critical' : daysRemaining < 14 ? 'Warning' : 'Healthy'
        }
      };
    }));

    return ApiResponse.success(res, { products: productsWithForecast, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug').lean();
    if (!product) return next(new AppError('Product not found', 404));
    return ApiResponse.success(res, { product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.create(parseProductPayload(req.body));
    
    // Asynchronous local AI SEO Generation
    if (!product.seoTitle || !product.seoDescription) {
      generateProductSEO({
        name: product.name,
        description: product.description,
        category: req.body.categoryName || 'General',
        tags: product.tags,
        price: product.price,
      })
      .then(async (seo) => {
        await Product.findByIdAndUpdate(product._id, {
          seoTitle: seo.seoTitle,
          seoDescription: seo.seoDescription,
          seoKeywords: seo.seoKeywords,
        });
      })
      .catch(console.error);
    }

    return ApiResponse.created(res, { product }, 'Product created');
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      parseProductPayload(req.body),
      { new: true, runValidators: true }
    );
    if (!product) return next(new AppError('Product not found', 404));

    // Retrigger Local AI SEO if name or desc changed
    if (req.body.name || req.body.description) {
      generateProductSEO({
        name: product.name,
        description: product.description,
        category: 'General',
        tags: product.tags,
        price: product.price,
      }).then(async (seo) => {
        await Product.findByIdAndUpdate(product._id, {
          seoTitle: seo.seoTitle,
          seoDescription: seo.seoDescription,
          seoKeywords: seo.seoKeywords,
        });
      }).catch(console.error);
    }
    
    // Invalidate stock forecast cache on product update
    await redisClient.del('stock:forecast');

    return ApiResponse.success(res, { product }, 'Product updated');
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));
    return ApiResponse.success(res, null, 'Product deleted');
  } catch (error) {
    next(error);
  }
};

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status && status !== 'all') query.orderStatus = status;
    if (search) query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { guestEmail: { $regex: search, $options: 'i' } },
    ];

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'firstName lastName email')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    return ApiResponse.success(res, { orders, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    let order = mongoose.Types.ObjectId.isValid(id)
      ? await Order.findById(id)
          .populate('user', 'firstName lastName email')
          .populate('items.product', 'name slug images')
          .lean()
      : null;

    if (!order) {
      order = await Order.findOne({ orderNumber: id })
        .populate('user', 'firstName lastName email')
        .populate('items.product', 'name slug images')
        .lean();
    }

    if (!order) return next(new AppError('Order not found', 404));
    return ApiResponse.success(res, { order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.body.status || req.body.orderStatus;
    if (!status || !ORDER_STATUSES.includes(status)) return next(new AppError('Invalid status', 400));

    const updates: Record<string, unknown> = { orderStatus: status };
    if (req.body.trackingNumber) updates.trackingNumber = req.body.trackingNumber;
    if (req.body.trackingUrl) updates.trackingUrl = req.body.trackingUrl;
    if (req.body.note) {
      updates.$push = {
        statusHistory: {
          status,
          note: req.body.note,
          timestamp: new Date(),
          updatedBy: req.user?._id,
        },
      };
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('user', 'email firstName');
    if (!order) return next(new AppError('Order not found', 404));

    return ApiResponse.success(res, { order }, 'Order status updated');
  } catch (error) {
    next(error);
  }
};

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────

export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const query: any = { role: 'user' };
    if (search) query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const [users, total] = await Promise.all([
      User.find(query).select('-password -refreshToken -emailVerifyToken -resetPasswordToken -resetPasswordExpires').sort('-createdAt').skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    // Attach order counts
    const userIds = users.map(u => u._id);
    const orderCounts = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 }, total: { $sum: '$total' } } },
    ]);
    const orderMap = new Map(orderCounts.map(o => [o._id.toString(), o]));
    const enriched = users.map(u => ({ ...u, orders: orderMap.get(u._id.toString())?.count || 0, totalSpent: orderMap.get(u._id.toString())?.total || 0 }));

    return ApiResponse.success(res, { customers: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find().sort('sortOrder').lean();
    const productCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(productCounts.map(p => [p._id.toString(), p.count]));
    const enriched = categories.map(c => ({ ...c, productCount: countMap.get(c._id.toString()) || 0 }));
    return ApiResponse.success(res, { categories: enriched });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.create(req.body);
    return ApiResponse.created(res, { category }, 'Category created');
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return next(new AppError('Category not found', 404));
    return ApiResponse.success(res, { category }, 'Category updated');
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inUse = await Product.exists({ category: req.params.id });
    if (inUse) return next(new AppError('Cannot delete — products exist in this category', 400));
    await Category.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Category deleted');
  } catch (error) {
    next(error);
  }
};

// ─── VOUCHERS ────────────────────────────────────────────────────────────────

export const getVouchers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const vouchers = await Voucher.find().sort('-createdAt').lean();
    return ApiResponse.success(res, { vouchers });
  } catch (error) {
    next(error);
  }
};

export const createVoucher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const voucher = await Voucher.create(req.body);
    return ApiResponse.created(res, { voucher }, 'Voucher created');
  } catch (error) {
    next(error);
  }
};

export const updateVoucher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!voucher) return next(new AppError('Voucher not found', 404));
    return ApiResponse.success(res, { voucher }, 'Voucher updated');
  } catch (error) {
    next(error);
  }
};

export const deleteVoucher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Voucher deleted');
  } catch (error) {
    next(error);
  }
};

// ─── STOCK INTELLIGENCE & FORECAST ───────────────────────────────────────────

export const getStockForecast = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'stock:forecast';
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return ApiResponse.success(res, JSON.parse(cached));
    }
    const forecast = await getForecastForAllProducts();
    await redisClient.set(cacheKey, JSON.stringify(forecast), 'EX', 600); // 10 minutes cache
    return ApiResponse.success(res, forecast);
  } catch (error) {
    next(error);
  }
};

export const getProductForecast = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forecast = await calculateStockForecast(req.params.productId);
    return ApiResponse.success(res, forecast);
  } catch (error) {
    next(error);
  }
};

export const getStockAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'stock:forecast';
    let forecast;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      forecast = JSON.parse(cached);
    } else {
      forecast = await getForecastForAllProducts();
      await redisClient.set(cacheKey, JSON.stringify(forecast), 'EX', 600);
    }
    
    const alerts = forecast.products.filter((p: any) => p.status === 'critical' || p.status === 'low');
    return ApiResponse.success(res, { alerts, summary: forecast.summary });
  } catch (error) {
    next(error);
  }
};

export const getSeasonalRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rules = await SeasonalRule.find().sort('name').lean();
    return ApiResponse.success(res, { rules });
  } catch (error) {
    next(error);
  }
};

export const createSeasonalRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rule = await SeasonalRule.create(req.body);
    await redisClient.del('stock:forecast');
    return ApiResponse.created(res, { rule }, 'Seasonal rule created');
  } catch (error) {
    next(error);
  }
};

export const updateSeasonalRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rule = await SeasonalRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) return next(new AppError('Rule not found', 404));
    await redisClient.del('stock:forecast');
    return ApiResponse.success(res, { rule }, 'Seasonal rule updated');
  } catch (error) {
    next(error);
  }
};

export const deleteSeasonalRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await SeasonalRule.findByIdAndDelete(req.params.id);
    await redisClient.del('stock:forecast');
    return ApiResponse.success(res, null, 'Seasonal rule deleted');
  } catch (error) {
    next(error);
  }
};

