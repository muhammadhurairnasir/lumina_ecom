import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IVoucher extends Document {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  usedBy: mongoose.Types.ObjectId[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  applicableCategories: mongoose.Types.ObjectId[];
  applicableProducts: mongoose.Types.ObjectId[];
  isValid(userId?: string | mongoose.Types.ObjectId, orderTotal?: number): { valid: boolean; reason?: string };
  createdAt: Date;
  updatedAt: Date;
}

const voucherSchema = new Schema<IVoucher>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percentage', 'fixed', 'free_shipping'], required: true },
    value: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  {
    timestamps: true,
  }
);

voucherSchema.methods.isValid = function (
  userId?: string | mongoose.Types.ObjectId,
  orderTotal: number = 0
): { valid: boolean; reason?: string } {
  const now = new Date();

  if (!this.isActive) {
    return { valid: false, reason: 'Voucher is not active' };
  }
  if (now < this.startDate) {
    return { valid: false, reason: 'Voucher is not yet valid' };
  }
  if (now > this.endDate) {
    return { valid: false, reason: 'Voucher has expired' };
  }
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, reason: 'Voucher usage limit reached' };
  }
  if (orderTotal < this.minOrderAmount) {
    return { valid: false, reason: `Minimum order amount of ${this.minOrderAmount} required` };
  }
  if (userId) {
    const alreadyUsed = this.usedBy.some((id: mongoose.Types.ObjectId) => id.toString() === userId.toString());
    if (alreadyUsed) {
      return { valid: false, reason: 'You have already used this voucher' };
    }
  }

  return { valid: true };
};

const Voucher: Model<IVoucher> = mongoose.model<IVoucher>('Voucher', voucherSchema);

export default Voucher;
