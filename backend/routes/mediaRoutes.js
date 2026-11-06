import { Router } from 'express';
import { uploadMedia } from '../controllers/mediaController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Upload media to Cloudinary (photos, voice notes, PDFs)
router.post('/upload', requireAuth, uploadMedia);

export default router;

