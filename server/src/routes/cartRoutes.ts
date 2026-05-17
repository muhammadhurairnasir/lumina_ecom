import { Router } from 'express';
import * as cartController from '../controllers/cartController';
import { optionalAuth, protect } from '../middlewares/auth';

const router = Router();

router.use(optionalAuth);

router.get('/', cartController.getCart);
router.delete('/', cartController.clearCart);

router.post('/items', cartController.addToCart);
router.patch('/items/:productId', cartController.updateQuantity);
router.delete('/items/:productId', cartController.removeItem);

router.post('/voucher', cartController.applyVoucher);
router.delete('/voucher', cartController.removeVoucher);

// Explicitly protect merge route
router.post('/merge', protect, cartController.mergeGuestCart);

export default router;
