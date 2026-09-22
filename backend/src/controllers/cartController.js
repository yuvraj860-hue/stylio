import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

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

const findCart = async (userId) => Cart.findOne({ userId });

const ensureCart = async (userId) => {
  let cart = await findCart(userId);
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
};

const computeTotal = (items, productsById) => {
  let total = 0;
  for (const item of items) {
    const product = productsById.get(String(item.productId));
    if (product) {
      total += product.price * item.qty;
    }
  }
  return Math.round(total * 100) / 100;
};

const enrichCart = async (cart) => {
  const productIds = cart.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = cart.items
    .filter((i) => byId.has(String(i.productId)))
    .map((i) => {
      const product = byId.get(String(i.productId));
      return {
        id: i._id,
        product,
        qty: i.qty,
        size: i.size,
        color: i.color,
      };
    });

  const total = computeTotal(cart.items, byId);

  if (Math.abs((cart.total || 0) - total) > 0.001) {
    cart.total = total;
    await cart.save();
  }

  return { items, total };
};

export const getCart = asyncHandler(async (req, res) => {
  const mongoUserId = await getMongoUserId(req.auth.userId);
  const cart = await ensureCart(mongoUserId);
  const result = await enrichCart(cart);
  res.status(200).json(result);
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId, qty = 1, size = '', color = '' } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.active) {
    throw new AppError('Product not found', 404);
  }

  const requestedQty = Math.max(parseInt(qty, 10) || 1, 1);
  const mongoUserId = await getMongoUserId(req.auth.userId);
  const cart = await ensureCart(mongoUserId);

  const existing = cart.items.find(
    (i) =>
      String(i.productId) === String(productId) &&
      i.size === size &&
      i.color === color
  );

  const combinedQty = (existing ? existing.qty : 0) + requestedQty;
  if (product.stock < combinedQty) {
    const maxAllocatable = Math.max(0, product.stock - (existing ? existing.qty : 0));
    throw new AppError(
      `Only ${Math.max(product.stock, 0)} in stock${maxAllocatable > 0 ? ` — you can add up to ${maxAllocatable} more` : ''}`,
      400
    );
  }

  if (existing) {
    existing.qty = combinedQty;
  } else {
    cart.items.push({
      productId,
      qty: requestedQty,
      size,
      color,
    });
  }

  await cart.save();
  const result = await enrichCart(cart);
  res.status(200).json(result);
});

export const updateItemQty = asyncHandler(async (req, res) => {
  const mongoUserId = await getMongoUserId(req.auth.userId);
  const cart = await ensureCart(mongoUserId);
  const item = cart.items.id(req.params.id);
  if (!item) {
    throw new AppError('Cart item not found', 404);
  }

  const qty = parseInt(req.body.qty, 10);
  if (!Number.isInteger(qty) || qty < 1) {
    throw new AppError('Quantity must be a positive integer', 400);
  }

  const product = await Product.findById(item.productId);
  if (!product || !product.active) {
    throw new AppError('Product no longer available', 404);
  }
  if (product.stock < qty) {
    throw new AppError(`Only ${Math.max(product.stock, 0)} in stock`, 400);
  }

  item.qty = qty;
  await cart.save();
  const result = await enrichCart(cart);
  res.status(200).json(result);
});

export const removeItem = asyncHandler(async (req, res) => {
  const mongoUserId = await getMongoUserId(req.auth.userId);
  const cart = await ensureCart(mongoUserId);
  const item = cart.items.id(req.params.id);
  if (!item) {
    throw new AppError('Cart item not found', 404);
  }

  item.deleteOne();
  await cart.save();
  const result = await enrichCart(cart);
  res.status(200).json(result);
});

export const clearCart = asyncHandler(async (req, res) => {
  const mongoUserId = await getMongoUserId(req.auth.userId);
  const cart = await ensureCart(mongoUserId);
  cart.items = [];
  cart.total = 0;
  await cart.save();
  res.status(200).json({ items: [], total: 0 });
});