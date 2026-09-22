import crypto from 'crypto';
import Stripe from 'stripe';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendOrderConfirmationEmail } from '../utils/mailer.js';

const stripeConfigured = Boolean(env.STRIPE_SECRET_KEY);
const stripeClient = stripeConfigured ? new Stripe(env.STRIPE_SECRET_KEY) : null;

const razorpayConfigured = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
const razorpayAuth = () =>
  `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')}`;

const createRazorpayOrderApi = async ({ amount, receipt, notes }) => {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: razorpayAuth(),
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt,
      notes: notes || {},
    }),
  });
  if (!res.ok) {
    throw new AppError('Razorpay order creation failed', 502);
  }
  return res.json();
};

const buildItemsFromBody = async (requestedItems) => {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    throw new AppError('At least one item is required', 400);
  }

  const productIds = requestedItems.map((i) => i.productId).filter(Boolean);
  const products = await Product.find({ _id: { $in: productIds }, active: true });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = [];
  for (const requested of requestedItems) {
    const product = byId.get(String(requested.productId));
    if (!product) {
      throw new AppError(`Product not found: ${requested.productId}`, 404);
    }
    const qty = Math.max(parseInt(requested.qty, 10) || 1, 1);
    if (product.stock < qty) {
      throw new AppError(`Insufficient stock for ${product.name}`, 400);
    }
    items.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      qty,
      size: requested.size || '',
      color: requested.color || '',
      imageUrl: product.imageUrl || '',
    });
  }

  return { items, productMap: byId };
};

const itemSignature = (items) =>
  items
    .map((i) => `${String(i.productId)}:${i.qty}:${i.size}:${i.color}`)
    .sort()
    .join('|');

const getMongoUserId = async (clerkId) => {
  let user = await User.findOne({ clerkId });
  if (!user) {
    user = await User.create({
      clerkId,
      name: 'Clerk User',
      email: `${clerkId}@clerk.user`,
    });
  }
  return user._id;
};

export const createOrder = asyncHandler(async (req, res) => {
  const { items: requestedItems, shippingAddress } = req.body;

  if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
    throw new AppError('Valid shippingAddress with street and city is required', 400);
  }

  const mongoUserId = await getMongoUserId(req.auth.userId);
  const { items } = await buildItemsFromBody(requestedItems);
  const total = Math.round(
    items.reduce((sum, i) => sum + i.price * i.qty, 0) * 100
  ) / 100;

  const signature = itemSignature(items);
  const recent = await Order.findOne({
    userId: mongoUserId,
    paymentStatus: 'pending',
    itemSignature: signature,
    createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
  });

  if (recent) {
    return res.status(200).json({
      clientSecret: `mock_${recent.paymentId}`,
      paymentIntentId: recent.paymentId,
    });
  }

  const order = await Order.create({
    userId: mongoUserId,
    items,
    total,
    itemSignature: signature,
    shippingAddress: {
      name: shippingAddress.name || '',
      email: shippingAddress.email || '',
      street: shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state || '',
      zip: shippingAddress.zip || '',
      country: shippingAddress.country || '',
    },
    paymentStatus: 'pending',
  });

  if (!stripeConfigured) {
    const mockPaymentIntentId = `mock_pi_${order._id.toString()}${crypto.randomBytes(6).toString('hex')}`;
    order.paymentId = mockPaymentIntentId;
    await order.save();
    return res.status(200).json({
      clientSecret: `mock_${mockPaymentIntentId}`,
      paymentIntentId: mockPaymentIntentId,
    });
  }

  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: Math.round(total * 100),
    currency: 'inr',
    metadata: { orderId: String(order._id), userId: String(mongoUserId) },
  });

  order.paymentId = paymentIntent.id;
  await order.save();

  res.status(200).json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
});

const verifyPaymentWithStripe = async (paymentIntentId) => {
  if (!stripeConfigured) {
    return true;
  }
  const intent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
  return intent.status === 'succeeded' || intent.status === 'requires_capture';
};

const claimOrder = async (orderId) =>
  Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: 'pending' },
    { $set: { paymentStatus: 'processing' } },
    { new: true }
  );

const decrementStock = async (items) => {
  for (const item of items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.productId, active: true, stock: { $gte: item.qty } },
      { $inc: { stock: -item.qty } },
      { new: true }
    );
    if (!updated) {
      throw new AppError(`Insufficient stock for ${item.name || 'a product'}`, 409);
    }
  }
};

const recomputeCartTotal = async (cart) => {
  if (!cart || cart.items.length === 0) {
    if (cart) {
      cart.items = [];
      cart.total = 0;
      await cart.save();
    }
    return;
  }
  const ids = cart.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids } });
  const priceById = new Map(products.map((p) => [String(p._id), p.price]));
  const total = cart.items.reduce(
    (sum, i) => sum + (priceById.get(String(i.productId)) || 0) * i.qty,
    0
  );
  cart.total = Math.round(total * 100) / 100;
  await cart.save();
};

const confirmOrder = async (paymentId, clerkId = null, alreadyVerified = false) => {
  let order = await Order.findOne({ paymentId });
  if (!order) {
    throw new AppError('Order not found for this payment', 404);
  }

  if (clerkId) {
    const mongoUserId = await getMongoUserId(clerkId);
    if (String(order.userId) !== String(mongoUserId)) {
      throw new AppError('Not authorized for this order', 403);
    }
  }

  if (order.paymentStatus === 'paid') {
    return order;
  }

  const claimed = await claimOrder(order._id);
  if (!claimed) {
    const fresh = await Order.findById(order._id);
    if (fresh && fresh.paymentStatus === 'paid') {
      return fresh;
    }
    throw new AppError('Payment is already being confirmed', 409);
  }
  order = claimed;

  const paid = alreadyVerified || (await verifyPaymentWithStripe(paymentId));
  if (!paid) {
    await Order.findByIdAndUpdate(order._id, { paymentStatus: 'failed' });
    throw new AppError('Payment not completed', 402);
  }

  try {
    await decrementStock(order.items);
  } catch (err) {
    await Order.findByIdAndUpdate(order._id, { paymentStatus: 'failed' });
    throw err;
  }

  const cart = await Cart.findOne({ userId: order.userId });
  if (cart) {
    const purchasedIds = new Set(order.items.map((i) => String(i.productId)));
    cart.items = cart.items.filter((i) => !purchasedIds.has(String(i.productId)));
    await recomputeCartTotal(cart);
  }

  order.paymentStatus = 'paid';
  order.status = 'placed';
  await order.save();

  void sendOrderConfirmationEmail(order).catch((err) =>
    console.warn(`Order email skipped (${order._id}): ${err.message}`)
  );
  return order;
};

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { items: requestedItems, shippingAddress } = req.body;

  if (razorpayConfigured === false) {
    return res.status(400).json({ status: 400, message: 'Razorpay not configured on the server' });
  }

  if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
    throw new AppError('Valid shippingAddress with street and city is required', 400);
  }

  const mongoUserId = await getMongoUserId(req.auth.userId);
  const { items } = await buildItemsFromBody(requestedItems);
  const total = Math.round(
    items.reduce((sum, i) => sum + i.price * i.qty, 0) * 100
  ) / 100;

  const signature = itemSignature(items);
  const recent = await Order.findOne({
    userId: mongoUserId,
    paymentStatus: 'pending',
    itemSignature: signature,
    createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
  });

  if (recent && recent.paymentId) {
    return res.status(200).json({
      orderId: recent.paymentId,
      amount: Math.round(recent.total * 100),
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
    });
  }

  const order = await Order.create({
    userId: mongoUserId,
    items,
    total,
    itemSignature: signature,
    shippingAddress: {
      name: shippingAddress.name || '',
      email: shippingAddress.email || '',
      phone: shippingAddress.phone || '',
      street: shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state || '',
      zip: shippingAddress.zip || '',
      country: shippingAddress.country || '',
    },
    paymentStatus: 'pending',
    status: 'placed',
  });

  const rzpOrder = await createRazorpayOrderApi({
    amount: Math.round(total * 100),
    receipt: `order_${order._id.toString()}`,
    notes: { orderId: String(order._id), userId: String(mongoUserId) },
  });

  order.paymentId = rzpOrder.id;
  await order.save();

  res.status(200).json({
    orderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: env.RAZORPAY_KEY_ID,
  });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const generatedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (generatedSignature !== razorpaySignature) {
    throw new AppError('Invalid Razorpay signature', 400);
  }

  const order = await confirmOrder(razorpayOrderId, req.auth.userId, true);
  res.status(200).json(order);
});

export const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  if (!paymentIntentId) {
    throw new AppError('paymentIntentId is required', 400);
  }
  const order = await confirmOrder(paymentIntentId, req.auth.userId);
  res.status(200).json(order);
});

export const getOrders = asyncHandler(async (req, res) => {
  const mongoUserId = await getMongoUserId(req.auth.userId);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ userId: mongoUserId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments({ userId: mongoUserId }),
  ]);

  res.status(200).json({
    orders,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

export const webhook = asyncHandler(async (req, res) => {
  if (!stripeConfigured) {
    return res.status(400).json({ status: 400, message: 'Stripe not configured' });
  }

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripeClient.webhooks.constructEvent(
      req.body,
      signature,
      env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
    );
  } catch (err) {
    return res.status(400).json({ status: 400, message: `Webhook signature verification failed: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntentId = event.data.object.id;
    const order = await Order.findOne({ paymentId: paymentIntentId });
    if (order && order.paymentStatus !== 'paid') {
      try {
        await confirmOrder(paymentIntentId);
      } catch (err) {
        console.error(`Webhook confirm failed for ${paymentIntentId}: ${err.message}`);
      }
    }
  }

  res.status(200).json({ received: true });
});