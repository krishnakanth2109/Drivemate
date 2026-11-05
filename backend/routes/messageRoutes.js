import { Router } from 'express';
import {
  getMessages,
  sendMessage,
  getDrivers,
  getRequests,
  sendRequest,
  respondRequest,
  getConversations,
} from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Message thread endpoints
router.get('/', getMessages);
router.post('/', requireAuth, sendMessage);

// Direct Driver Connections & Requests endpoints
router.get('/drivers', requireAuth, getDrivers);
router.get('/requests', requireAuth, getRequests);
router.post('/requests/send', requireAuth, sendRequest);
router.post('/requests/respond', requireAuth, respondRequest);
router.get('/conversations', requireAuth, getConversations);

export default router;
