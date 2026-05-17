import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AppError } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';

// Helpers
const signAccessToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
};

const signRefreshToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email is already registered', 409));
    }

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const hashedVerifyToken = crypto.createHash('sha256').update(emailVerifyToken).digest('hex');

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      emailVerifyToken: hashedVerifyToken,
    });

    // Send email (async, don't await so it doesn't block response)
    sendVerificationEmail(user.email, emailVerifyToken).catch((err) => console.error(err));

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    const userData = user.toJSON();

    return ApiResponse.created(res, { user: userData, accessToken }, 'User registered successfully. Please verify your email.');
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (!user.isEmailVerified) {
      // Prompt mentioned: Check isEmailVerified (warn but don't block)
      // So we just proceed but could include a warning in response message
    }

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    const userData = user.toJSON();

    const message = user.isEmailVerified ? 'Login successful' : 'Login successful, but email is not verified';

    return ApiResponse.success(res, { user: userData, accessToken }, message);
  } catch (error) {
    next(error);
  }
};

export const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return next(new AppError('Invalid credentials', 401));

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(new AppError('Invalid credentials', 401));

    if (user.role !== 'admin') return next(new AppError('Access denied. Admin only.', 403));

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set adminToken cookie — this is what the Next.js middleware reads
    res.cookie('adminToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    setRefreshTokenCookie(res, refreshToken);

    return ApiResponse.success(res, { user: user.toJSON(), accessToken }, 'Admin login successful');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return next(new AppError('Not authorized, no refresh token', 401));
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as { id: string };

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError('Invalid refresh token', 401));
    }

    const accessToken = signAccessToken(user.id, user.role);
    
    // Optionally rotate refresh token
    const newRefreshToken = signRefreshToken(user.id, user.role);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });
    
    setRefreshTokenCookie(res, newRefreshToken);

    return ApiResponse.success(res, { accessToken }, 'Token refreshed successfully');
  } catch (error) {
    next(new AppError('Not authorized, invalid token', 401));
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (refreshToken) {
      // Remove token from user
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string, { ignoreExpiration: true }) as { id: string };
      await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
    }

    const clearOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 0,
      path: '/',
    };
    res.clearCookie('refreshToken', clearOpts);
    res.clearCookie('adminToken', clearOpts);

    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('There is no user with that email address', 404));
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.save({ validateBeforeSave: false });

    sendPasswordResetEmail(user.email, resetToken).catch((err) => {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.save({ validateBeforeSave: false });
      console.error(err);
    });

    return ApiResponse.success(res, null, 'Password reset token sent to email');
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = undefined; // invalidate refresh token

    await user.save();

    return ApiResponse.success(res, null, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ emailVerifyToken: hashedToken });

    if (!user) {
      return next(new AppError('Invalid or expired verification token', 400));
    }

    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    await user.save({ validateBeforeSave: false });

    return ApiResponse.success(res, null, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};
