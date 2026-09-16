import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { chat } from '../controllers/stylistController.js';

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many chat requests, please slow down',
  },
});

router.post('/chat', chatLimiter, chat);

export default router;