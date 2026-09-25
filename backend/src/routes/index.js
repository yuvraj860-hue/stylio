import { Router } from 'express';
import productRoutes from './products.js';
import cartRoutes from './cart.js';
import orderRoutes from './orders.js';
import stylistRoutes from './stylist.js';
import adminRoutes from './admin.js';
import deliveryRoutes from './delivery.js';
import warehouseRoutes from './warehouse.js';
import userRoutes from './user.js';

const router = Router();

router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/stylist', stylistRoutes);
router.use('/admin', adminRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/warehouse', warehouseRoutes);
router.use('/user', userRoutes);

export default router;