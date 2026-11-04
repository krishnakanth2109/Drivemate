import { Router } from 'express';
import { getMessages, sendMessage } from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getMessages);
router.post('/', requireAuth, sendMessage);

export default router;

