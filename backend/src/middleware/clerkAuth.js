import { verifyToken } from '@clerk/backend';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const clerkAuth = asyncHandler(async (req, res, next) => {
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
    req.auth = { userId: payload.sub };
    next();
  } catch (err) {
    throw new AppError('Invalid or expired token', 401);
  }
});

export const clerkOptionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    req.auth = null;
    return next();
  }

  if (!env.CLERK_SECRET_KEY) {
    req.auth = null;
    return next();
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });
    req.auth = { userId: payload.sub };
  } catch (err) {
    req.auth = null;
  }
  next();
});