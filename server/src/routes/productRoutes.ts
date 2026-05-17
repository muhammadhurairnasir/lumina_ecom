import { Router } from 'express';
import * as productController from '../controllers/productController';
import { protect, restrictTo } from '../middlewares/auth';
import { uploadImages } from '../middlewares/upload';
import Product from '../models/Product';
import Category from '../models/Category';

const router = Router();

// PUBLIC
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/search', productController.searchProducts);

// SEO sitemap data — consumed by next-sitemap during build
router.get('/sitemap', async (_req, res) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }, 'slug').lean(),
      Category.find({ isActive: true }, 'slug').lean(),
    ]);
    res.set('Cache-Control', 'public, max-age=3600');
    res.json({
      products: products.map((p) => p.slug),
      categories: categories.map((c) => c.slug),
    });
  } catch {
    res.json({ products: [], categories: [] });
  }
});

router.get('/:slug', productController.getProductBySlug);


// ADMIN
router.use('/admin', protect, restrictTo('admin'));

router.post('/admin', productController.createProduct);
router.put('/admin/:id', productController.updateProduct);
router.delete('/admin/:id', productController.deleteProduct);

router.post('/admin/:id/images', uploadImages.array('images', 8), productController.uploadProductImages);
router.delete('/admin/:id/images/:publicId', productController.deleteProductImage);

export default router;
