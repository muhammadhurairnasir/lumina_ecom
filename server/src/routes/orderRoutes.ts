import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { optionalAuth, protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Important: Webhook goes strictly directly into controller since it needs raw body
// DO NOT attach it to router here if we map body-parser at app level, 
// wait, if we map express.json() BEFORE the router in app.ts, it will fail.
// So we must expose this route in app.ts specifically before express.json() is applied.
// We will leave the route here for clarity but it won't actually hit the raw body if app.ts parses it first.
// Let's create a separate exported webhook router or handle it natively in app.ts.
// It is better handled natively in app.ts or a separate untouched route.
// We will export a webhookRouter here to keep it organized.
export const webhookRouter = Router();
webhookRouter.post('/stripe', orderController.stripeWebhook);

// Regular Routes
router.post('/checkout', optionalAuth, orderController.createOrder);
router.post('/confirm', optionalAuth, orderController.confirmOrder);
router.get('/my-orders', protect, orderController.getUserOrders);
router.get('/stripe/config', orderController.getStripeConfig);
router.get('/:orderNumber', optionalAuth, orderController.getOrder);

// Admin Routes
router.use('/admin', protect, restrictTo('admin'));

router.get('/admin/stats', orderController.getOrderStats);
router.get('/admin', orderController.getAllOrders);
router.patch('/admin/:id/status', orderController.updateOrderStatus);

export default router;
