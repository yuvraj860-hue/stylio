import jwt from 'jsonwebtoken';
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

  // Try Clerk token verification
  if (env.CLERK_SECRET_KEY) {
    try {
      const payload = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
      });
      req.auth = { userId: payload.sub };
      return next();
    } catch (err) {
      // Fall through to JWT verification
    }
  }

  // Fallback: Custom JWT verification
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.auth = { userId: decoded.userId || decoded.id };
    return next();
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

  if (env.CLERK_SECRET_KEY) {
    try {
      const payload = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
      });
      req.auth = { userId: payload.sub };
      return next();
    } catch (err) {
      // Continue to JWT fallback
    }
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.auth = { userId: decoded.userId || decoded.id };
  } catch (err) {
    req.auth = null;
  }
  next();
});