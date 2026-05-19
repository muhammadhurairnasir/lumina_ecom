import { Router } from 'express';
import * as chatbotController from '../controllers/chatbotController';
import { optionalAuth } from '../middlewares/auth';

const router = Router();

router.use(optionalAuth);

router.post('/message', chatbotController.handleMessage);
router.delete('/session/:sessionId', chatbotController.clearSession);

export default router;
