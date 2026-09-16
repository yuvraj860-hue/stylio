import { Router } from 'express';
import express from 'express';
import {
  createOrder,
  getOrders,
  confirmPayment,
  webhook,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  webhook
);

router.use(protect);

router.post(
  '/checkout',
  validate({
    'items': { required: true },
    'shippingAddress.street': { required: true },
    'shippingAddress.city': { required: true },
  }),
  createOrder
);

router.post(
  '/razorpay-checkout',
  validate({
    'items': { required: true },
    'shippingAddress.street': { required: true },
    'shippingAddress.city': { required: true },
  }),
  createRazorpayOrder
);

router.post(
  '/razorpay-verify',
  validate({
    razorpayOrderId: { required: true },
    razorpayPaymentId: { required: true },
    razorpaySignature: { required: true },
  }),
  verifyRazorpayPayment
);

router.post(
  '/',
  validate({
    paymentIntentId: { required: true },
  }),
  confirmPayment
);

router.get('/', getOrders);

export default router;