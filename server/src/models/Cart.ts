import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  variant?: string;
  price: number; // Snapshot
  name: string; // Snapshot
  image?: string; // Snapshot
}

export interface ICart extends Document {
  user?: mongoose.Types.ObjectId;
  sessionId?: string;
  items: ICartItem[];
  appliedVoucher?: mongoose.Types.ObjectId;
  subtotal: number;
  discount: number;
  total: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: { type: String },
  price: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String },
});

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    sessionId: { type: String },
    items: [cartItemSchema],
    appliedVoucher: { type: Schema.Types.ObjectId, ref: 'Voucher' },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

cartSchema.pre<ICart>('save', async function (next) {
  // Recalculate subtotal
  this.subtotal = this.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Calculate discount if voucher is applied
  if (this.appliedVoucher) {
    const Voucher = mongoose.model('Voucher');
    const voucher = await Voucher.findById(this.appliedVoucher);
    if (voucher && voucher.isActive) {
      if (voucher.type === 'fixed') {
        this.discount = voucher.value;
      } else if (voucher.type === 'percentage') {
        this.discount = (this.subtotal * voucher.value) / 100;
        if (voucher.maxDiscount && this.discount > voucher.maxDiscount) {
          this.discount = voucher.maxDiscount;
        }
      } else {
        this.discount = 0; // free_shipping discount is usually handled differently, but kept 0 here
      }
    } else {
      this.discount = 0;
      this.appliedVoucher = undefined;
    }
  } else {
    this.discount = 0;
  }

  // Recalculate total
  this.total = Math.max(this.subtotal - this.discount, 0);

  next();
});

const Cart: Model<ICart> = mongoose.model<ICart>('Cart', cartSchema);

export default Cart;
