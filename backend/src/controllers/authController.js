import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendWelcomeEmail } from '../utils/mailer.js';

const signToken = (id) =>
  jwt.sign({ id }, env.JWT_SECRET, { expiresIn: '7d' });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (confirmPassword && confirmPassword !== password) {
    throw new AppError('Passwords do not match', 400);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = await User.create({ name, email, password });

  void sendWelcomeEmail(user).catch((err) =>
    console.warn(`Welcome email skipped: ${err.message}`)
  );

  res.status(201).json({
    token: signToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  res.status(200).json({
    token: signToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    wishlist: user.wishlist,
  });
});