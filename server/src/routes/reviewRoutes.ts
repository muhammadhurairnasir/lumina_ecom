import { Router } from 'express';
import * as reviewController from '../controllers/reviewController';
import { protect } from '../middlewares/auth';

const router = Router({ mergeParams: true });

// Mounted either at /api/v1/reviews OR /api/v1/products/:productId/reviews
router.get('/', reviewController.getProductReviews);

router.use(protect);
router.post('/', reviewController.addReview);
router.patch('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);
router.post('/:id/helpful', reviewController.toggleHelpful);

export default router;
