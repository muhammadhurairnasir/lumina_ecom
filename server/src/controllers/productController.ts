import { Request, Response, NextFunction } from 'express';

import Product from '../models/Product';
import Category from '../models/Category';
import Review from '../models/Review';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { generateProductSEO, generateProductSlug } from '../services/aiService';
import { v2 as cloudinary } from 'cloudinary';

// ---------------- PUBLIC CONTROLLERS ----------------

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, minPrice, maxPrice, tags, brand, rating, inStock, isFeatured, search, sort, page, limit } = req.query;

    const query: any = { isActive: true };

    // Search
    if (search) {
      query.$text = { $search: search as string };
    }

    // Filters
    if (category) {
      const categorySlug = String(category).toLowerCase().trim();
      const categoryDoc = await Category.findOne({ slug: categorySlug });
      if (categoryDoc) query.category = categoryDoc._id;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (tags) {
      const tagsArray = (tags as string).split(',').map((t) => t.trim());
      query.tags = { $in: tagsArray };
    }
    if (brand) query.brand = brand as string;
    if (rating) query.rating = { $gte: Number(rating) };
    if (inStock === 'true') query.stock = { $gt: 0 };
    if (isFeatured === 'true') query.isFeatured = true;

    // Sorting (supports legacy keys + frontend query values)
    let sortOptions: any = {};
    if (search) {
      sortOptions.score = { $meta: 'textScore' };
    } else {
      const sortKey = String(sort || '-createdAt');
      switch (sortKey) {
        case 'price':
        case 'price_asc':
          sortOptions.price = 1;
          break;
        case '-price':
        case 'price_desc':
          sortOptions.price = -1;
          break;
        case 'rating':
        case '-rating':
          sortOptions.rating = -1;
          break;
        case 'newest':
        case '-createdAt':
          sortOptions.createdAt = -1;
          break;
        case 'createdAt':
          sortOptions.createdAt = 1;
          break;
        case 'popular':
        case '-viewCount':
          sortOptions.viewCount = -1;
          break;
        default:
          sortOptions.createdAt = -1;
      }
    }

    // Pagination
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 12;
    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find(query, search ? { score: { $meta: 'textScore' } } : {})
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber)
      .populate('category', 'name slug');

    const total = await Product.countDocuments(query);

    // Aggregated filters for sidebar
    const brands = await Product.distinct('brand', { isActive: true });
    const maxProductPrice = await Product.findOne({ isActive: true }).sort('-price').select('price');

    const totalPages = Math.ceil(total / limitNumber) || 1;

    return ApiResponse.success(res, {
      products,
      total,
      totalPages,
      page: pageNumber,
      filters: {
        brands: brands.filter(Boolean),
        priceRange: { min: 0, max: maxProductPrice?.price || 1000 },
      },
    }, 'Products retrieved', 200, {
      total,
      page: pageNumber,
      pages: totalPages,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findOneAndUpdate(
      { slug: req.params.slug, isActive: true },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('category', 'name slug');

    if (!product) return next(new AppError('Product not found', 404));

    const recentReviews = await Review.find({ product: product._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName avatar');

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    })
      .sort({ rating: -1 })
      .limit(8);

    return ApiResponse.success(res, {
      product,
      recentReviews,
      relatedProducts,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true }).limit(8).populate('category', 'name slug');
    return ApiResponse.success(res, { products });
  } catch (error) {
    next(error);
  }
};

export const getNewArrivals = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(12).populate('category', 'name slug');
    return ApiResponse.success(res, { products });
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (req: Request, res: Response, next: NextFunction) => {
  // Can reuse getProducts logic by passing q to search. We'll just map q -> search
  req.query.search = req.query.q;
  return getProducts(req, res, next);
};

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find({ isActive: true });
    
    // Get product count per category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat._id, isActive: true });
        return { ...cat.toJSON(), productCount: count };
      })
    );

    return ApiResponse.success(res, { categories: categoriesWithCount });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) return next(new AppError('Category not found', 404));

    const products = await Product.find({ category: category._id, isActive: true }).limit(12);

    return ApiResponse.success(res, { category, products });
  } catch (error) {
    next(error);
  }
};

// ---------------- ADMIN CONTROLLERS ----------------

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existingSlugs = await Product.find().distinct('slug');
    const slug = await generateProductSlug(req.body.name, existingSlugs);

    const product = await Product.create({ ...req.body, slug });

    // Async SEO Generation
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
      .catch((err) => console.error('Failed to generate SEO', err));

    return ApiResponse.created(res, { product }, 'Product created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) return next(new AppError('Product not found', 404));

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    // Retrigger SEO if name or desc changed
    if (req.body.name || req.body.description) {
      generateProductSEO({
        name: updatedProduct!.name,
        description: updatedProduct!.description,
        category: 'General',
        tags: updatedProduct!.tags,
        price: updatedProduct!.price,
      })
        .then(async (seo) => {
          await Product.findByIdAndUpdate(updatedProduct!._id, {
            seoTitle: seo.seoTitle,
            seoDescription: seo.seoDescription,
            seoKeywords: seo.seoKeywords,
          });
        })
        .catch((err) => console.error('Failed to regenerate SEO', err));
    }

    return ApiResponse.success(res, { product: updatedProduct }, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return next(new AppError('Product not found', 404));
    return ApiResponse.success(res, null, 'Product deleted successfully (soft delete)');
  } catch (error) {
    next(error);
  }
};

export const uploadProductImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));

    if (product.images.length + (req.files as Express.Multer.File[]).length > 8) {
      return next(new AppError('Maximum 8 images allowed per product', 400));
    }

    const newImages = (req.files as Express.Multer.File[]).map((file) => ({
      url: file.path,
      publicId: file.filename, // Cloudinary provides public_id in filename field for multer-storage-cloudinary
      alt: product.name,
    }));

    product.images.push(...newImages);
    await product.save({ validateBeforeSave: false });

    return ApiResponse.success(res, { images: product.images }, 'Images uploaded successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteProductImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));

    const imageIndex = product.images.findIndex((img) => img.publicId === req.params.publicId);
    if (imageIndex === -1) return next(new AppError('Image not found', 404));

    // Remove from Cloudinary
    await cloudinary.uploader.destroy(req.params.publicId);

    // Remove from DB
    product.images.splice(imageIndex, 1);
    await product.save({ validateBeforeSave: false });

    return ApiResponse.success(res, { images: product.images }, 'Image deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.create(req.body);
    return ApiResponse.created(res, { category }, 'Category created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return next(new AppError('Category not found', 404));
    return ApiResponse.success(res, { category }, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return next(new AppError('Category not found', 404));
    return ApiResponse.success(res, null, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};
