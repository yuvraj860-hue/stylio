import { Router } from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  getWarehouseStats
} from '../controllers/adminController.js';
import { warehouseAuth } from '../middleware/adminAuth.js';
import { validateId, validate } from '../middleware/validate.js';

const router = Router();

router.use(warehouseAuth);

router.get('/products', getProducts);
router.post('/products', createProduct);
router.patch('/products/:id', validateId('id'), updateProduct);
router.delete('/products/:id', validateId('id'), deleteProduct);
router.patch('/products/:id/stock', validateId('id'), validate({ stock: { type: 'number' }, quantity: { type: 'number' } }), updateStock);
router.get('/products/low-stock', getLowStockProducts);
router.get('/stats', getWarehouseStats);

export default router;