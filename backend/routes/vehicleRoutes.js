import { Router } from 'express';
import { getVehicles, addVehicle, removeVehicle } from '../controllers/vehicleController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getVehicles);
router.post('/', addVehicle);
router.delete('/:vehicleId', removeVehicle);

export default router;

