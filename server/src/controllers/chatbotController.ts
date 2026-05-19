import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import * as chatbotService from '../services/chatbotService';
import Order from '../models/Order';
import Cart from '../models/Cart';
import { ApiResponse } from '../utils/apiResponse';

const getSessionId = (req: Request, res: Response): string => {
  let sessionId = req.cookies.chatbotSessionId;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    res.cookie('chatbotSessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });
  }
  return sessionId;
};

export const handleMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    let sessionId = req.body.sessionId || getSessionId(req, res);

    if (!message) {
      return res.status(400).json({ status: 'error', message: 'Message is required' });
    }

    // Build Context
    const context: any = {};
    
    if (req.user) {
      context.userId = req.user.id;
      context.userName = req.user.firstName;
      context.orderCount = await Order.countDocuments({ user: req.user.id });
      
      const cart = await Cart.findOne({ user: req.user.id });
      if (cart) {
        context.cartSubtotal = cart.subtotal;
        context.cartItems = cart.items;
      }
    } else {
      const cartSessionId = req.cookies.cartSessionId;
      if (cartSessionId) {
        const cart = await Cart.findOne({ sessionId: cartSessionId });
        if (cart) {
          context.cartSubtotal = cart.subtotal;
          context.cartItems = cart.items;
        }
      }
    }

    const { reply, suggestions, actions } = await chatbotService.processChatMessage(sessionId, message, context);

    return ApiResponse.success(res, {
      reply,
      suggestions,
      actions,
      sessionId,
    });
  } catch (error) {
    next(error);
  }
};

export const clearSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.sessionId;
    await chatbotService.clearChatHistory(sessionId);
    res.clearCookie('chatbotSessionId');
    return ApiResponse.success(res, null, 'Chatbot session cleared');
  } catch (error) {
    next(error);
  }
};
