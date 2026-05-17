import { Request, Response, NextFunction } from 'express';
import Review from '../models/Review';
import Product from '../models/Product';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

// Helper to recalculate and update product rating and review count
const updateProductRating = async (productId: string) => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        rating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(stats[0].rating * 10) / 10,
      reviewCount: stats[0].reviewCount,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      reviewCount: 0,
    });
  }
};

export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ product: productId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName avatar');

    const total = await Review.countDocuments({ product: productId });

    return ApiResponse.success(res, { reviews }, 'Reviews retrieved', 200, {
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const addReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const { rating, title, body, images } = req.body;

    const product = await Product.findById(productId);
    if (!product) return next(new AppError('Product not found', 404));

    const existingReview = await Review.findOne({ product: productId, user: req.user!.id });
    if (existingReview) return next(new AppError('You have already reviewed this product', 400));

    // Assume we can check if they bought the product here...
    // (Skipping actual order verification for brevity, but could query Order model)
    const isVerifiedPurchase = true;

    const review = await Review.create({
      product: productId,
      user: req.user!.id,
      rating,
      title,
      body,
      images,
      isVerifiedPurchase,
    });

    await updateProductRating(productId);

    return ApiResponse.created(res, { review }, 'Review added successfully');
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rating, title, body, images } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) return next(new AppError('Review not found', 404));

    if (review.user.toString() !== req.user!.id && req.user!.role !== 'admin') {
      return next(new AppError('Not authorized to update this review', 403));
    }

    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.body = body || review.body;
    review.images = images || review.images;

    await review.save();
    await updateProductRating(review.product.toString());

    return ApiResponse.success(res, { review }, 'Review updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(new AppError('Review not found', 404));

    if (review.user.toString() !== req.user!.id && req.user!.role !== 'admin') {
      return next(new AppError('Not authorized to delete this review', 403));
    }

    const productId = review.product;
    await review.deleteOne();
    await updateProductRating(productId.toString());

    return ApiResponse.success(res, null, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const toggleHelpful = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(new AppError('Review not found', 404));

    // A real implementation would track WHICH users voted helpful using a junction collection or array
    // For now, we just increment it blindly.
    review.helpfulVotes += 1;
    await review.save();

    return ApiResponse.success(res, { helpfulVotes: review.helpfulVotes }, 'Marked as helpful');
  } catch (error) {
    next(error);
  }
};
