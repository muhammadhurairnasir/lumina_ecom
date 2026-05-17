import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOrderHistory {
  status: string;
  note?: string;
  timestamp: Date;
  updatedBy?: mongoose.Types.ObjectId;
}

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface IOrderAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  user?: mongoose.Types.ObjectId;
  sessionId?: string;
  guestEmail?: string;
  items: IOrderItem[];
  shippingAddress: IOrderAddress;
  billingAddress: IOrderAddress;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentIntentId?: string;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  statusHistory: IOrderHistory[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  appliedVoucher?: mongoose.Types.ObjectId;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
  isGuestOrder: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IOrderModel extends Model<IOrder> {
  generateOrderNumber(): Promise<string>;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  variant: { type: String },
});

const orderAddressSchema = new Schema<IOrderAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true },
});

const orderHistorySchema = new Schema<IOrderHistory>({
  status: { type: String, required: true },
  note: { type: String },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
});

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    sessionId: { type: String },
    guestEmail: { type: String },
    items: [orderItemSchema],
    shippingAddress: { type: orderAddressSchema, required: true },
    billingAddress: { type: orderAddressSchema, required: true },
    paymentMethod: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentIntentId: { type: String },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    statusHistory: [orderHistorySchema],
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    appliedVoucher: { type: Schema.Types.ObjectId, ref: 'Voucher' },
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    notes: { type: String },
    isGuestOrder: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

orderSchema.statics.generateOrderNumber = async function (): Promise<string> {
  const currentYear = new Date().getFullYear();
  // Simple approach: find the latest order of the current year and increment
  const lastOrder = await this.findOne({
    orderNumber: new RegExp(`^ORD-${currentYear}-`),
  }).sort({ createdAt: -1 });

  let sequence = 1;
  if (lastOrder && lastOrder.orderNumber) {
    const parts = lastOrder.orderNumber.split('-');
    if (parts.length === 3) {
      sequence = parseInt(parts[2], 10) + 1;
    }
  }

  const paddedSequence = sequence.toString().padStart(6, '0');
  return `ORD-${currentYear}-${paddedSequence}`;
};

// Also add a pre-save to auto-generate if not set
orderSchema.pre<IOrder>('save', async function (next) {
  if (!this.orderNumber) {
    const OrderModel = mongoose.model<IOrder, IOrderModel>('Order');
    this.orderNumber = await OrderModel.generateOrderNumber();
  }
  next();
});

const Order = mongoose.model<IOrder, IOrderModel>('Order', orderSchema);

export default Order;
