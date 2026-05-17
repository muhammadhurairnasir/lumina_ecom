import { Router } from 'express';
import * as productController from '../controllers/productController';
import { protect, restrictTo } from '../middlewares/auth';
import { uploadImages } from '../middlewares/upload';

const router = Router();

// PUBLIC
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/search', productController.searchProducts);
router.get('/:slug', productController.getProductBySlug);

// ADMIN
router.use('/admin', protect, restrictTo('admin'));

router.post('/admin', productController.createProduct);
router.put('/admin/:id', productController.updateProduct);
router.delete('/admin/:id', productController.deleteProduct);

router.post('/admin/:id/images', uploadImages.array('images', 8), productController.uploadProductImages);
router.delete('/admin/:id/images/:publicId', productController.deleteProductImage);

export default router;
