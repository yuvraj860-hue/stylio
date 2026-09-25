import User from '../models/User.js';
import Product from '../models/Product.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const getMongoUser = async (clerkId) => {
  let user = await User.findOne({ clerkId });
  if (!user) {
    user = await User.create({
      clerkId,
      name: 'Clerk User',
      email: `${clerkId}@clerk.user`,
      wishlist: [],
    });
  }
  return user;
};

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await getMongoUser(req.auth.userId);
  await user.populate({
    path: 'wishlist',
    match: { active: true },
  });

  res.status(200).json({
    wishlist: user.wishlist || [],
    count: user.wishlist?.length || 0,
  });
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product || !product.active) {
    throw new AppError('Product not found or unavailable', 404);
  }

  const user = await getMongoUser(req.auth.userId);
  const existsIndex = user.wishlist.findIndex(
    (id) => String(id) === String(productId)
  );

  let inWishlist = false;
  if (existsIndex > -1) {
    user.wishlist.splice(existsIndex, 1);
    inWishlist = false;
  } else {
    user.wishlist.push(product._id);
    inWishlist = true;
  }

  await user.save();
  res.status(200).json({
    inWishlist,
    productId,
    count: user.wishlist.length,
    wishlist: user.wishlist,
  });
});
