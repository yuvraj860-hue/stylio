import { verifyToken } from '@clerk/backend';
import User from '../models/User.js';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const adminAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    throw new AppError('Not authorized, no token provided', 401);
  }

  if (!env.CLERK_SECRET_KEY) {
    throw new AppError('Clerk not configured on server', 500);
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });
    const clerkId = payload.sub;

    let user = await User.findOne({ clerkId });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role !== 'admin') {
      throw new AppError('Admin access required', 403);
    }

    req.auth = { userId: payload.sub, mongoUserId: user._id, role: user.role };
    req.user = user;
    next();
  } catch (err) {
    throw new AppError('Invalid or expired token', 401);
  }
});

export const deliveryAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    throw new AppError('Not authorized, no token provided', 401);
  }

  if (!env.CLERK_SECRET_KEY) {
    throw new AppError('Clerk not configured on server', 500);
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });
    const clerkId = payload.sub;

    let user = await User.findOne({ clerkId });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!['admin', 'delivery'].includes(user.role)) {
      throw new AppError('Delivery partner access required', 403);
    }

    req.auth = { userId: payload.sub, mongoUserId: user._id, role: user.role };
    req.user = user;
    next();
  } catch (err) {
    throw new AppError('Invalid or expired token', 401);
  }
});

export const warehouseAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    throw new AppError('Not authorized, no token provided', 401);
  }

  if (!env.CLERK_SECRET_KEY) {
    throw new AppError('Clerk not configured on server', 500);
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });
    const clerkId = payload.sub;

    let user = await User.findOne({ clerkId });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!['admin', 'warehouse'].includes(user.role)) {
      throw new AppError('Warehouse access required', 403);
    }

    req.auth = { userId: payload.sub, mongoUserId: user._id, role: user.role };
    req.user = user;
    next();
  } catch (err) {
    throw new AppError('Invalid or expired token', 401);
  }
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const payload = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
      });
      let user = await User.findOne({ clerkId: payload.sub });
      if (!user) {
        user = await User.create({
          name: payload.given_name
            ? `${payload.given_name} ${payload.family_name || ''}`.trim()
            : (payload.email || 'Clerk User'),
          email: (payload.email || '') ,
          password: 'clerk_managed',
          clerkId: payload.sub,
        });
      }
      req.auth = { userId: payload.sub, mongoUserId: user._id, role: user.role };
      req.user = user;
    } catch (err) {
      req.auth = null;
    }
  }
  next();
});