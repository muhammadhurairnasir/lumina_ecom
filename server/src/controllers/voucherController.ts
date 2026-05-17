import { Request, Response, NextFunction } from 'express';
import Voucher from '../models/Voucher';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export const getAllVouchers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });
    return ApiResponse.success(res, { vouchers });
  } catch (error) {
    next(error);
  }
};

export const createVoucher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscount, validFrom, validUntil, usageLimit } = req.body;

    const voucher = await Voucher.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
    });

    return ApiResponse.created(res, { voucher }, 'Voucher created');
  } catch (error) {
    next(error);
  }
};

export const updateVoucher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!voucher) return next(new AppError('Voucher not found', 404));

    return ApiResponse.success(res, { voucher }, 'Voucher updated');
  } catch (error) {
    next(error);
  }
};

export const deactivateVoucher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!voucher) return next(new AppError('Voucher not found', 404));

    return ApiResponse.success(res, null, 'Voucher deactivated');
  } catch (error) {
    next(error);
  }
};

export const getVoucherUsage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) return next(new AppError('Voucher not found', 404));

    // Wait for orders to be implemented, but hypothetically:
    // const orders = await Order.find({ 'voucher.code': voucher.code }).select('total orderNumber user createdAt');
    // For now, return the basic usage count tracked on the voucher itself
    
    return ApiResponse.success(res, { 
      usedCount: voucher.usedCount,
      usageLimit: voucher.usageLimit,
    });
  } catch (error) {
    next(error);
  }
};
