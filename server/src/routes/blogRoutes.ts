import { Router } from 'express';
import { getPosts, getPost } from '../controllers/blogController';

const router = Router();

router.get('/', getPosts);
router.get('/:slug', getPost);

export default router;
