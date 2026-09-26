import mongoose from 'mongoose';
import Product from '../models/Product.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import apiClient from '../utils/apiClient.js';

const indexInML = async (product, imageUrl) => {
  try {
    await apiClient.post('/api/ml/products', [
      {
        product_id: String(product._id),
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        brand: product.brand,
        tags: product.tags,
        image_url: imageUrl || product.imageUrl,
      },
    ]);
  } catch (err) {
    console.warn(`ML indexing skipped for product ${product._id}: ${err.message}`);
  }
};

const indexManyInML = async (products) => {
  try {
    const payload = products.map((product) => ({
      product_id: String(product._id),
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      brand: product.brand,
      tags: product.tags,
      image_url: product.imageUrl,
    }));
    await apiClient.post('/api/ml/products', payload);
  } catch (err) {
    console.warn(`ML indexing skipped for ${products.length} products: ${err.message}`);
  }
};

const syncEmbeddingId = async (productId, embeddingId) => {
  try {
    if (embeddingId) {
      await Product.findByIdAndUpdate(productId, { embeddingId });
    }
  } catch (err) {
    console.warn(`Could not sync embeddingId for ${productId}: ${err.message}`);
  }
};

export const listProducts = asyncHandler(async (req, res) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    featured,
    sort,
    page = 1,
    limit = 12,
  } = req.query;

  const query = { active: true };

  if (featured === 'true' || featured === true) {
    query.featured = true;
  }

  if (category) {
    const categories = Array.isArray(category) ? category : [category];
    const escaped = categories
      .filter(Boolean)
      .map((c) => new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
    if (escaped.length === 1) {
      query.category = escaped[0];
    } else if (escaped.length > 1) {
      query.category = { $in: escaped };
    }
  }

  if (minPrice !== undefined && minPrice !== '' || maxPrice !== undefined && maxPrice !== '') {
    query.price = {};
    if (minPrice !== undefined && minPrice !== '') {
      const min = Number(minPrice);
      if (!Number.isFinite(min) || min < 0) {
        throw new AppError('minPrice must be a non-negative number', 400);
      }
      query.price.$gte = min;
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      const max = Number(maxPrice);
      if (!Number.isFinite(max) || max < 0) {
        throw new AppError('maxPrice must be a non-negative number', 400);
      }
      query.price.$lte = max;
    }
  }

  if (search) {
    const term = String(search).trim().slice(0, 100);
    if (term) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { brand: { $regex: escaped, $options: 'i' } },
        { tags: { $elemMatch: { $regex: escaped, $options: 'i' } } },
        { category: { $regex: escaped, $options: 'i' } },
      ];
    }
  }

  let sortQuery = {};
  if (sort === 'price_asc') sortQuery = { price: 1 };
  else if (sort === 'price_desc') sortQuery = { price: -1 };
  else if (sort === 'featured') sortQuery = { featured: -1, createdAt: -1 };
  else if (sort === 'newest') sortQuery = { createdAt: -1 };
  else if (sort === 'rating' || sort === 'top_rated') sortQuery = { rating: -1, numReviews: -1 };
  else sortQuery = { createdAt: -1 };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query).sort(sortQuery).skip(skip).limit(limitNum),
    Product.countDocuments(query),
  ]);

  res.status(200).json({
    products,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  res.status(200).json(product);
});

export const adminCreateProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);

  indexInML(product);
  res.status(201).json(product);
});

export const adminUpdateProduct = asyncHandler(async (req, res) => {
  const old = await Product.findById(req.params.id);
  if (!old) {
    throw new AppError('Product not found', 404);
  }

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  indexInML(product);
  res.status(200).json(product);
});

export const adminDeleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  res.status(200).json({ message: 'Product deleted', id: product._id });
});

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;

  if (req.params.id) {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { imageUrl: url },
      { new: true, runValidators: true }
    );
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    indexInML(product, url);
    return res.status(200).json(product);
  }

  res.status(200).json({ imageUrl: url, filename: req.file.filename });
});

export const indexExistingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ active: true });
  let indexed = 0;

  const batchSize = 50;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    await indexManyInML(batch);
    indexed += batch.length;
  }

  res.status(200).json({ indexed, total: products.length });
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 20);
  let ids = [];

  try {
    const ml = await apiClient.post('/api/ml/recommend', {
      product_id: req.params.id,
      limit,
    });
    ids = (ml.results || []).map((r) => r.product_id).filter(Boolean);
  } catch (err) {
    console.warn(`ML recommend unavailable for ${req.params.id}: ${err.message}`);
    ids = [];
  }

  if (ids.length === 0) {
    const base = await Product.findById(req.params.id);
    if (base) {
      const similar = await Product.find({
        _id: { $ne: base._id },
        active: true,
        category: base.category,
      }).limit(limit);
      res.status(200).json(similar);
      return;
    }
    res.status(200).json([]);
    return;
  }

  const products = await Product.find({ _id: { $in: ids }, active: true });
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const ordered = ids
    .map((id) => byId.get(String(id)))
    .filter(Boolean)
    .slice(0, limit);

  if (ordered.length < limit && await Product.findById(req.params.id)) {
    const base = await Product.findById(req.params.id);
    const already = new Set(ordered.map((p) => String(p._id)).concat(String(base._id)));
    const fallback = await Product.find({
      _id: { $nin: [...already] },
      active: true,
      category: base.category,
    }).limit(limit - ordered.length);
    ordered.push(...fallback);
  }

  res.status(200).json(ordered);
});

export const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment, userName } = req.body;
  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    throw new AppError('Rating must be a number between 1 and 5', 400);
  }
  if (!comment || !comment.trim()) {
    throw new AppError('Review comment cannot be empty', 400);
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  let mongoUserId = null;
  let reviewerName = userName || 'Verified Buyer';

  if (req.auth && req.auth.userId) {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (user) {
      mongoUserId = user._id;
      reviewerName = user.name || reviewerName;
    }
  }

  // Ensure reviews array exists
  if (!Array.isArray(product.reviews)) {
    product.reviews = [];
  }

  // Check if user already reviewed
  const alreadyReviewed = mongoUserId && product.reviews.find(
    (r) => String(r.userId) === String(mongoUserId)
  );

  if (alreadyReviewed) {
    alreadyReviewed.rating = numRating;
    alreadyReviewed.comment = comment.trim();
    alreadyReviewed.createdAt = new Date();
  } else {
    product.reviews.push({
      userId: mongoUserId || new mongoose.Types.ObjectId(),
      userName: reviewerName,
      rating: numRating,
      comment: comment.trim(),
      createdAt: new Date(),
    });
  }

  product.numReviews = product.reviews.length;
  product.rating =
    Math.round(
      (product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length) *
        10
    ) / 10;

  await product.save();

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    product,
  });
});