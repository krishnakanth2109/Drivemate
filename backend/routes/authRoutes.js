import { Router } from 'express';
import {
  register,
  login,
  verifyToken,
  getProfile,
  updateProfile,
  logout,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify', requireAuth, verifyToken);
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.post('/logout', requireAuth, logout);

export default router;

