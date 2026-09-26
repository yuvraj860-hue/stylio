import { Router } from 'express';
import express from 'express';
import {
  createOrder,
  getOrders,
  confirmPayment,
  webhook,
  createRazorpayOrder,
  verifyRazorpayPayment,
  cancelOrder,
  requestReturn,
  validateCoupon,
} from '../controllers/orderController.js';
import { clerkAuth, clerkOptionalAuth } from '../middleware/clerkAuth.js';
import { validate, validateId } from '../middleware/validate.js';

const router = Router();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  webhook
);

router.post(
  '/validate-coupon',
  clerkOptionalAuth,
  validate({
    code: { required: true },
  }),
  validateCoupon
);

router.use(clerkAuth);

router.post(
  '/checkout',
  validate({
    items: { required: true },
    shippingAddress: {
      street: { required: true },
      city: { required: true },
    },
  }),
  createOrder
);

router.post(
  '/razorpay-checkout',
  validate({
    items: { required: true },
    shippingAddress: {
      street: { required: true },
      city: { required: true },
    },
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

router.post('/:id/cancel', validateId('id'), cancelOrder);
router.post('/:id/return', validateId('id'), requestReturn);

export default router;