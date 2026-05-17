import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  category: string;
  tags: string[];
  readTime: number;
  isPublished: boolean;
  publishedAt: Date;
  seoTitle: string;
  seoDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>(
  {
    title:          { type: String, required: true, trim: true },
    slug:           { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt:        { type: String, required: true },
    content:        { type: String, required: true },
    coverImage:     { type: String, default: '' },
    author:         { type: String, default: 'Lumina Editorial' },
    category:       { type: String, default: 'Lifestyle' },
    tags:           [{ type: String }],
    readTime:       { type: Number, default: 5 },
    isPublished:    { type: Boolean, default: true },
    publishedAt:    { type: Date, default: Date.now },
    seoTitle:       { type: String, default: '' },
    seoDescription: { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-generate slug from title
blogPostSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  // Auto-fill SEO if empty
  if (!this.seoTitle) this.seoTitle = `${this.title} | Lumina Blog`;
  if (!this.seoDescription) this.seoDescription = this.excerpt.slice(0, 160);
  next();
});

const BlogPost: Model<IBlogPost> = mongoose.model<IBlogPost>('BlogPost', blogPostSchema);

export default BlogPost;
