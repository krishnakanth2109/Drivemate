import { Router } from 'express';
import { logEvent, getEvents } from '../controllers/analyticsController.js';

const router = Router();

router.post('/event', logEvent);
router.get('/events', getEvents);

export default router;

