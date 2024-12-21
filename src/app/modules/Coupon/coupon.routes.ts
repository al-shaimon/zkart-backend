import express from 'express';
import { CouponController } from './coupon.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import validateRequest from '../../middlewares/validateRequest';
import { CouponValidation } from './coupon.validation';

const router = express.Router();

// Public routes
router.get('/', auth(UserRole.ADMIN), CouponController.getAllCoupons);

router.get('/my-coupons', auth(UserRole.VENDOR), CouponController.getVendorCoupons);

router.get('/:code', CouponController.getCouponByCode);

// Vendor routes

// Admin and Vendor routes
router.post(
  '/create-coupon',
  auth(UserRole.ADMIN, UserRole.VENDOR),
  validateRequest(CouponValidation.create),
  CouponController.createCoupon
);

router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.VENDOR),
  validateRequest(CouponValidation.update),
  CouponController.updateCoupon
);

router.delete('/:id', auth(UserRole.ADMIN, UserRole.VENDOR), CouponController.deleteCoupon);

router.get(
  '/vendor/single/:id',
  auth(UserRole.VENDOR),
  CouponController.getVendorCouponById
);

export const CouponRoutes = router;
