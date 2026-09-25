import { Router } from 'express';
import {
  getDeliveryOrders,
  getLiveDeliveryOrders,
  acceptDeliveryOrder,
  updateDeliveryStatus,
  getDeliveryPartnerStats
} from '../controllers/adminController.js';
import { deliveryAuth } from '../middleware/adminAuth.js';
import { validateId, validate } from '../middleware/validate.js';

const router = Router();

router.use(deliveryAuth);

router.get('/stats', getDeliveryPartnerStats);
router.get('/orders', getDeliveryOrders);
router.get('/orders/live', getLiveDeliveryOrders);
router.post('/orders/:id/accept', validateId('id'), acceptDeliveryOrder);
router.patch('/orders/:id/status', validateId('id'), validate({ status: { required: true, enum: ['processing', 'shipped', 'delivered'] } }), updateDeliveryStatus);

export default router;