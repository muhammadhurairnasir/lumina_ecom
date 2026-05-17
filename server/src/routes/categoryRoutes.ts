import { Router } from 'express';
import * as productController from '../controllers/productController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// PUBLIC
router.get('/', productController.getCategories);
router.get('/:slug', productController.getCategoryBySlug);

// ADMIN
router.use('/admin', protect, restrictTo('admin'));

router.post('/admin', productController.createCategory);
router.put('/admin/:id', productController.updateCategory);
router.delete('/admin/:id', productController.deleteCategory);

export default router;
