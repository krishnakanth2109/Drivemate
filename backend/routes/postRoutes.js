import { Router } from 'express';
import { getPosts, createPost, toggleLike, deletePost } from '../controllers/postController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Viewing posts is open or authenticated
router.get('/', (req, res, next) => {
  // Try authenticating if header present, but don't reject guests
  if (req.headers.authorization || req.headers['x-auth-token']) {
    return requireAuth(req, res, next);
  }
  return next();
}, getPosts);

// Creating post strictly requires authentication
router.post('/', requireAuth, createPost);

// Liking post requires authentication
router.post('/:postId/like', requireAuth, toggleLike);

// Deleting post requires authentication
router.delete('/:postId', requireAuth, deletePost);

export default router;

