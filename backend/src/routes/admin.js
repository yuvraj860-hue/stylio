import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  assignDeliveryPartner,
  getDeliveryOrders,
  getLiveDeliveryOrders,
  acceptDeliveryOrder,
  updateDeliveryStatus,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  getWarehouseStats,
  getActivityLogs,
  getDeliveryPartnerStats
} from '../controllers/adminController.js';
import { adminAuth, deliveryAuth, warehouseAuth } from '../middleware/adminAuth.js';
import { validateId, validate } from '../middleware/validate.js';

const router = Router();

router.use(adminAuth);

router.get('/dashboard/stats', getDashboardStats);

router.get('/users', getAllUsers);
router.get('/users/:id', validateId('id'), getUserById);
router.patch('/users/:id/role', validateId('id'), validate({ role: { required: true, enum: ['user', 'admin', 'delivery', 'warehouse'] } }), updateUserRole);
router.delete('/users/:id', validateId('id'), deleteUser);

router.get('/orders', getAllOrders);
router.get('/orders/:id', validateId('id'), getOrderById);
router.patch('/orders/:id/status', validateId('id'), validate({ status: { required: true, enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'] } }), updateOrderStatus);
router.post('/orders/:id/assign', validateId('id'), validate({ deliveryPartnerId: { required: true } }), assignDeliveryPartner);

router.get('/products', getProducts);
router.post('/products', createProduct);
router.patch('/products/:id', validateId('id'), updateProduct);
router.delete('/products/:id', validateId('id'), deleteProduct);
router.patch('/products/:id/stock', validateId('id'), validate({ stock: { type: 'number' }, quantity: { type: 'number' } }), updateStock);
router.get('/products/low-stock', getLowStockProducts);

router.get('/warehouse/stats', getWarehouseStats);

router.get('/activity-logs', getActivityLogs);

export default router;