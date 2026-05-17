import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Order from '../models/Order';
import { AppError } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    return ApiResponse.success(res, { user }, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { firstName, lastName, phone, avatar },
      { new: true, runValidators: true }
    );

    return ApiResponse.success(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user!.id).select('+password');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Incorrect current password', 401));
    }

    user.password = newPassword;
    await user.save(); // pre-save hook handles hashing

    return ApiResponse.success(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return next(new AppError('User not found', 404));

    if (req.body.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    user.addresses.push(req.body);
    await user.save({ validateBeforeSave: false });

    return ApiResponse.success(res, { addresses: user.addresses }, 'Address added successfully');
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return next(new AppError('User not found', 404));

    const address = (user.addresses as any).id(req.params.id);
    if (!address) return next(new AppError('Address not found', 404));

    if (req.body.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    address.set(req.body);
    await user.save({ validateBeforeSave: false });

    return ApiResponse.success(res, { addresses: user.addresses }, 'Address updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return next(new AppError('User not found', 404));

    (user.addresses as any).pull(req.params.id);
    await user.save({ validateBeforeSave: false });

    return ApiResponse.success(res, { addresses: user.addresses }, 'Address deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id).populate('wishlist');
    return ApiResponse.success(res, { wishlist: user?.wishlist }, 'Wishlist retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return next(new AppError('User not found', 404));

    const productId = req.params.productId as any;
    const index = user.wishlist.indexOf(productId);

    if (index === -1) {
      user.wishlist.push(productId);
    } else {
      user.wishlist.splice(index, 1);
    }

    await user.save({ validateBeforeSave: false });
    
    const populatedUser = await user.populate('wishlist');

    return ApiResponse.success(res, { wishlist: populatedUser.wishlist }, 'Wishlist updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await Order.find({ user: req.user!.id }).sort({ createdAt: -1 });
    return ApiResponse.success(res, { orders }, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};
