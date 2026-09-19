import jwt from 'jsonwebtoken';
import { verifyToken } from '@clerk/backend';
import User from '../models/User.js';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    throw new AppError('Not authorized, no token provided', 401);
  }

  // Try Clerk token first
  if (env.CLERK_SECRET_KEY) {
    try {
      const payload = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
      });
      const clerkId = payload.sub;

      let user = await User.findOne({ clerkId });
      if (!user) {
        user = await User.create({
          name: payload.given_name
            ? `${payload.given_name} ${payload.family_name || ''}`.trim()
            : (payload.email || 'Clerk User'),
          email: (payload.email || payload.email_addresses && payload.email_addresses[0]) || '',
          password: 'clerk_managed',
          clerkId,
        });
      }
      req.user = user;
      return next();
    } catch (err) {
      // Not a valid Clerk token, try legacy JWT
    }
  }

  // Fallback: legacy JWT
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Not authorized, token invalid or expired', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('Not authorized, user not found', 401);
  }
  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    // Try Clerk token
    if (env.CLERK_SECRET_KEY) {
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
        req.user = user;
        return next();
      } catch (err) {
        // Not a valid Clerk token
      }
    }

    // Fallback: legacy JWT
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (err) {
      req.user = null;
    }
  }
  next();
});

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  next(new AppError('Admin access required', 403));
};
