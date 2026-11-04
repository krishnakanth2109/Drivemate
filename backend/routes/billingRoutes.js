import { Router } from 'express';
import { getBillingStatus, upgradeToPro, buySinglePass } from '../controllers/billingController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/status', getBillingStatus);
router.post('/upgrade-pro', upgradeToPro);
router.post('/buy-single-pass', buySinglePass);

export default router;

