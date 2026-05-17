import { Request, Response, NextFunction } from 'express';
import BlogPost from '../models/BlogPost';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

// ── PUBLIC ──────────────────────────────────────────────────────────────────

export const getPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page    = parseInt(req.query.page as string)  || 1;
    const limit   = parseInt(req.query.limit as string) || 9;
    const tag     = req.query.tag      as string;
    const category = req.query.category as string;
    const skip    = (page - 1) * limit;

    const query: any = { isPublished: true };
    if (tag)      query.tags     = tag;
    if (category) query.category = category;

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .select('-content')           // list view — exclude heavy HTML
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlogPost.countDocuments(query),
    ]);

    return ApiResponse.success(res, { posts, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, isPublished: true }).lean();
    if (!post) return next(new AppError('Post not found', 404));
    return ApiResponse.success(res, { post });
  } catch (err) { next(err); }
};

// ── ADMIN CRUD ───────────────────────────────────────────────────────────────

export const adminGetPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip  = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      BlogPost.find().select('-content').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      BlogPost.countDocuments(),
    ]);

    return ApiResponse.success(res, { posts, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const adminGetPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return next(new AppError('Post not found', 404));
    return ApiResponse.success(res, { post });
  } catch (err) { next(err); }
};

export const adminCreatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await BlogPost.create(req.body);
    return ApiResponse.success(res, { post }, 'Post created', 201);
  } catch (err) { next(err); }
};

export const adminUpdatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!post) return next(new AppError('Post not found', 404));
    return ApiResponse.success(res, { post }, 'Post updated');
  } catch (err) { next(err); }
};

export const adminDeletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) return next(new AppError('Post not found', 404));
    return ApiResponse.success(res, null, 'Post deleted');
  } catch (err) { next(err); }
};
