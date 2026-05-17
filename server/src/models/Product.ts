import mongoose, { Document, Model, Schema } from 'mongoose';
import slugify from 'slugify';

export interface IProductImage {
  url: string;
  publicId: string;
  alt?: string;
}

export interface IProductSpecification {
  key: string;
  value: string;
}

export interface IProductVariantOption {
  label: string;
  price: number;
  stock: number;
}

export interface IProductVariant {
  name: string;
  options: IProductVariantOption[];
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: IProductImage[];
  category: mongoose.Types.ObjectId;
  tags: string[];
  stock: number;
  sku?: string;
  brand?: string;
  rating: number;
  reviewCount: number;
  viewCount: number;
  isFeatured: boolean;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  specifications: IProductSpecification[];
  variants: IProductVariant[];
  isInStock: boolean; // Virtual
  createdAt: Date;
  updatedAt: Date;
}

const productImageSchema = new Schema<IProductImage>({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  alt: { type: String },
});

const productSpecificationSchema = new Schema<IProductSpecification>({
  key: { type: String, required: true },
  value: { type: String, required: true },
});

const productVariantOptionSchema = new Schema<IProductVariantOption>({
  label: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
});

const productVariantSchema = new Schema<IProductVariant>({
  name: { type: String, required: true },
  options: [productVariantOptionSchema],
});

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, index: true },
    compareAtPrice: { type: Number },
    images: [productImageSchema],
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    tags: { type: [String], index: true },
    stock: { type: Number, required: true, default: 0 },
    sku: { type: String, trim: true },
    brand: { type: String, trim: true },
    rating: { type: Number, default: 0, index: true },
    reviewCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },
    seoKeywords: { type: [String], default: [] },
    specifications: [productSpecificationSchema],
    variants: [productVariantSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('isInStock').get(function (this: IProduct) {
  return this.stock > 0;
});

productSchema.pre<IProduct>('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

productSchema.index(
  { name: 'text', description: 'text', tags: 'text', brand: 'text' },
  { weights: { name: 10, tags: 5, brand: 3, description: 1 } }
);

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);

export default Product;
