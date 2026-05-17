import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth';
import * as admin from '../controllers/adminController';

const router = Router();

// All admin routes require authentication + admin role
router.use(protect, restrictTo('admin'));

// Dashboard
router.get('/stats', admin.getStats);

// Products
router.get('/products', admin.getProducts);
router.get('/products/:id', admin.getProduct);
router.post('/products', admin.createProduct);
router.put('/products/:id', admin.updateProduct);
router.delete('/products/:id', admin.deleteProduct);

// Orders
router.get('/orders', admin.getOrders);
router.get('/orders/:id', admin.getOrder);
router.patch('/orders/:id/status', admin.updateOrderStatus);

// Customers
router.get('/customers', admin.getCustomers);

// Categories
router.get('/categories', admin.getCategories);
router.post('/categories', admin.createCategory);
router.put('/categories/:id', admin.updateCategory);
router.delete('/categories/:id', admin.deleteCategory);

// Vouchers
router.get('/vouchers', admin.getVouchers);
router.post('/vouchers', admin.createVoucher);
router.put('/vouchers/:id', admin.updateVoucher);
router.delete('/vouchers/:id', admin.deleteVoucher);

export default router;
