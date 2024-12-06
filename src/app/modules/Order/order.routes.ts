import express from 'express';
import { OrderController } from './order.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import validateRequest from '../../middlewares/validateRequest';
import { OrderValidation } from './order.validation';

const router = express.Router();

// Move this route to the top for better visibility
router.patch(
  '/payment-status',
  auth(UserRole.CUSTOMER),
  validateRequest(OrderValidation.updatePayment),
  OrderController.updatePaymentStatus
);

// Customer routes
router.post(
  '/create-order',
  auth(UserRole.CUSTOMER),
  validateRequest(OrderValidation.create),
  OrderController.createOrder
);

router.get('/my-orders', auth(UserRole.CUSTOMER), OrderController.getMyOrders);

// Vendor routes
router.get('/vendor-orders', auth(UserRole.VENDOR), OrderController.getVendorOrders);

router.patch(
  '/:id/status',
  auth(UserRole.VENDOR),
  validateRequest(OrderValidation.updateStatus),
  OrderController.updateOrderStatus
);

// Shared routes
router.get(
  '/:id',
  auth(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.VENDOR),
  OrderController.getOrderById
);

// Admin routes
router.get('/', auth(UserRole.ADMIN), OrderController.getAllOrders);

// Add webhook route
router.post('/webhook', express.raw({ type: 'application/json' }), OrderController.webhook);

// Add new route for applying coupon
router.post(
  '/apply-coupon',
  auth(UserRole.CUSTOMER),
  validateRequest(OrderValidation.applyCoupon),
  OrderController.applyCoupon
);

export const OrderRoutes = router;
