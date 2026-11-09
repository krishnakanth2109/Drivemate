import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  sendOtp,
  verifyOtp,
  forgotPassword,
  verifyToken,
  getProfile,
  updateProfile,
  logout,
  deleteAccount,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', forgotPassword);
router.get('/verify', requireAuth, verifyToken);
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.post('/logout', requireAuth, logout);
router.delete('/account', requireAuth, deleteAccount);
router.delete('/delete-account', requireAuth, deleteAccount);

export default router;

