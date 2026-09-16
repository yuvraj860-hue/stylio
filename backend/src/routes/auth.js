import { Router } from 'express';
import { register, login, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { sanitizeBody, validate } from '../middleware/validate.js';

const router = Router();

const emailPattern = { regex: /^\S+@\S+\.\S+$/, message: 'Please provide a valid email address' };

router.post(
  '/register',
  sanitizeBody(['name', 'email', 'password', 'confirmPassword']),
  validate({
    name: { required: true },
    email: { required: true, pattern: emailPattern },
    password: { required: true, minLength: 6, maxLength: 72 },
  }),
  register
);

router.post(
  '/login',
  sanitizeBody(['email', 'password']),
  validate({
    email: { required: true, pattern: emailPattern },
    password: { required: true },
  }),
  login
);

router.get('/me', protect, me);

export default router;