import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as chatbotController from '../controllers/chatbotController';
import { optionalAuth } from '../middlewares/auth';

const router = Router();

// Rate limiting: max 20 requests per minute per IP
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many requests to the chatbot, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(optionalAuth);

router.post('/message', chatbotLimiter, chatbotController.handleMessage);
router.delete('/session/:sessionId', chatbotController.clearSession);

export default router;
