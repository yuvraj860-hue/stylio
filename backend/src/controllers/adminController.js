import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ActivityLog from '../models/ActivityLog.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalOrders,
    totalProducts,
    pendingOrders,
    totalRevenue,
    recentOrders,
    recentUsers,
    lowStockProducts
  ] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Product.countDocuments({ active: true }),
    Order.countDocuments({ status: { $in: ['placed', 'processing'] } }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Order.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name email'),
    User.find().sort({ createdAt: -1 }).limit(10).select('name email role createdAt'),
    Product.find({ active: true, stock: { $lt: 10 } }).select('name stock price')
  ]);

  const revenue = totalRevenue[0]?.total || 0;

  res.status(200).json({
    stats: {
      totalUsers,
      totalOrders,
      totalProducts,
      pendingOrders,
      totalRevenue: revenue,
      lowStockCount: lowStockProducts.length
    },
    recentOrders,
    recentUsers,
    lowStockProducts
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const search = req.query.search || '';
  const role = req.query.role || '';
  const skip = (page - 1) * limit;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  if (role) {
    query.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v'),
    User.countDocuments(query)
  ]);

  const usersWithOrderCount = await Promise.all(
    users.map(async (user) => {
      const orderCount = await Order.countDocuments({ userId: user._id });
      const totalSpent = await Order.aggregate([
        { $match: { userId: user._id, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);
      return {
        ...user.toObject(),
        orderCount,
        totalSpent: totalSpent[0]?.total || 0
      };
    })
  );

  res.status(200).json({
    users: usersWithOrderCount,
    total,
    page,
    pages: Math.ceil(total / limit)
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-__v');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const orders = await Order.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .populate('items.productId', 'name price imageUrl')
    .select('items total status paymentStatus createdAt');

  res.status(200).json({ user, orders });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin', 'delivery', 'warehouse'].includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select('-__v');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({ user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.status(200).json({ message: 'User deleted successfully' });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const status = req.query.status || '';
  const paymentStatus = req.query.paymentStatus || '';
  const search = req.query.search || '';
  const skip = (page - 1) * limit;

  const query = {};
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (search) {
    query.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { 'shippingAddress.name': { $regex: search, $options: 'i' } }
    ];
  }

  const results = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .populate('items.productId', 'name price imageUrl'),
    Order.countDocuments(query)
  ]);

  const orders = results[0];
  const total = results[1];

  res.status(200).json({
    orders,
    total,
    page,
    pages: Math.ceil(total / limit)
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('items.productId', 'name price imageUrl');
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  res.status(200).json({ order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber, courierName } = req.body;
  const validStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const updateData = { status };
  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  if (courierName) updateData.courierName = courierName;

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('userId', 'name email').populate('items.productId', 'name price');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  res.status(200).json({ order });
});

export const assignDeliveryPartner = asyncHandler(async (req, res) => {
  const { deliveryPartnerId } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { deliveryPartner: deliveryPartnerId, status: 'processing' },
    { new: true, runValidators: true }
  ).populate('userId', 'name email').populate('deliveryPartner', 'name email');

  if (!order) {
    throw new AppError('Order not found', 404);
  }
  res.status(200).json({ order });
});

export const getDeliveryOrders = asyncHandler(async (req, res) => {
  const status = req.query.status || 'all';
  const query = { deliveryPartner: req.auth.mongoUserId };
  if (status !== 'all') {
    query.status = status;
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'name email phone')
    .populate('items.productId', 'name price imageUrl')
    .populate('shippingAddress');

  res.status(200).json({ orders });
});

export const getLiveDeliveryOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    status: { $in: ['placed', 'processing'] },
    deliveryPartner: { $exists: false }
  })
    .sort({ createdAt: 1 })
    .populate('userId', 'name email phone')
    .populate('items.productId', 'name price imageUrl')
    .populate('shippingAddress');

  res.status(200).json({ orders });
});

export const acceptDeliveryOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, deliveryPartner: { $exists: false } },
    { deliveryPartner: req.auth.mongoUserId, status: 'processing' },
    { new: true }
  ).populate('userId', 'name email phone').populate('items.productId', 'name price imageUrl');

  if (!order) {
    throw new AppError('Order not available or already assigned', 404);
  }

  res.status(200).json({ order });
});

export const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { status, otp } = req.body;
  const validStatuses = ['processing', 'shipped', 'delivered'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status for delivery', 400);
  }

  const existingOrder = await Order.findOne({
    _id: req.params.id,
    deliveryPartner: req.auth.mongoUserId,
  });

  if (!existingOrder) {
    throw new AppError('Order not found or not assigned to you', 404);
  }

  // If completing delivery, verify customer's 4-digit OTP if configured
  if (status === 'delivered' && existingOrder.deliveryOtp) {
    if (!otp || String(otp).trim() !== String(existingOrder.deliveryOtp).trim()) {
      throw new AppError(
        'Invalid or missing Delivery OTP. Please enter the 4-digit OTP provided by the customer.',
        400
      );
    }
  }

  existingOrder.status = status;
  await existingOrder.save();

  await existingOrder.populate('userId', 'name email');
  await existingOrder.populate('items.productId', 'name price');

  res.status(200).json({ order: existingOrder });
});

export const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const search = req.query.search || '';
  const category = req.query.category || '';
  const active = req.query.active;
  const skip = (page - 1) * limit;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  if (category) query.category = category;
  if (active !== undefined) query.active = active === 'true';

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(query)
  ]);

  res.status(200).json({ products, total, page, pages: Math.ceil(total / limit) });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  res.status(200).json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  res.status(200).json({ message: 'Product deleted successfully' });
});

export const updateStock = asyncHandler(async (req, res) => {
  const { stock, quantity } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (quantity !== undefined) {
    product.stock = Math.max(0, product.stock + quantity);
  } else if (stock !== undefined) {
    product.stock = Math.max(0, stock);
  }

  await product.save();
  res.status(200).json({ product });
});

export const getLowStockProducts = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold, 10) || 10;
  const products = await Product.find({
    active: true,
    stock: { $lt: threshold }
  }).select('name stock price category');

  res.status(200).json({ products, count: products.length });
});

export const getWarehouseStats = asyncHandler(async (req, res) => {
  const [
    totalProducts,
    activeProducts,
    lowStockProducts,
    outOfStockProducts,
    totalStockValue
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ active: true }),
    Product.countDocuments({ active: true, stock: { $lt: 10, $gt: 0 } }),
    Product.countDocuments({ active: true, stock: 0 }),
    Product.aggregate([
      { $match: { active: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$stock', '$price'] } } } }
    ])
  ]);

  const stockValue = totalStockValue[0]?.total || 0;

  const categoryStats = await Product.aggregate([
    { $match: { active: true } },
    { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    stats: {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue: stockValue
    },
    categoryStats
  });
});

export const getActivityLogs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const type = req.query.type || '';
  const userId = req.query.userId || '';
  const skip = (page - 1) * limit;

  const query = {};
  if (type) query.type = type;
  if (userId) query.userId = userId;

  const [logs, total] = await Promise.all([
    ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email'),
    ActivityLog.countDocuments(query)
  ]);

  res.status(200).json({ logs, total, page, pages: Math.ceil(total / limit) });
});

export const getDeliveryPartnerStats = asyncHandler(async (req, res) => {
  const partnerId = req.auth.mongoUserId;
  const [
    assignedOrders,
    deliveredOrders,
    pendingOrders,
    totalEarnings
  ] = await Promise.all([
    Order.countDocuments({ deliveryPartner: partnerId }),
    Order.countDocuments({ deliveryPartner: partnerId, status: 'delivered' }),
    Order.countDocuments({ deliveryPartner: partnerId, status: { $in: ['processing', 'shipped'] } }),
    Order.aggregate([
      { $match: { deliveryPartner: partnerId, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ])
  ]);

  const earnings = totalEarnings[0]?.total || 0;

  res.status(200).json({
    stats: {
      assignedOrders,
      deliveredOrders,
      pendingOrders,
      totalEarnings: earnings
    }
  });
});