import { Router } from 'express';
import {
  getCart,
  addItem,
  updateItemQty,
  removeItem,
  clearCart,
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';
import { validateId, validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/', getCart);

router.post(
  '/items',
  validate({
    productId: { required: true },
  }),
  addItem
);

router.put(
  '/items/:id',
  validateId('id'),
  validate({
    qty: { required: true },
  }),
  updateItemQty
);

router.delete(
  '/items/:id',
  validateId('id'),
  removeItem
);

router.delete('/', clearCart);

export default router;