import { Router } from 'express';
import {
  register,
  login,
  loginWithOtp,
  googleAuth,
  sendOtp,
  verifyOtp,
  forgotPassword,
  verifyToken,
  getProfile,
  updateProfile,
  logout,
  deleteAccount,
  resendVerificationEmail,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/login-otp', loginWithOtp);
router.post('/google', googleAuth);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', forgotPassword);
router.post('/resend-verification', requireAuth, resendVerificationEmail);
router.post('/send-verification-email', resendVerificationEmail);
router.get('/verify', requireAuth, verifyToken);
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.post('/logout', requireAuth, logout);
router.delete('/account', requireAuth, deleteAccount);
router.delete('/delete-account', requireAuth, deleteAccount);

export default router;

