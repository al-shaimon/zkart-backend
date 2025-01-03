import express from 'express';
import { ReviewController } from './review.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewValidation } from './review.validation';

const router = express.Router();

router.post(
  '/create',
  auth(UserRole.CUSTOMER),
  validateRequest(ReviewValidation.create),
  ReviewController.createReview
);

router.get('/:productId', ReviewController.getProductReviews);

router.get(
  '/vendor/my-product-reviews',
  auth(UserRole.VENDOR),
  ReviewController.getVendorProductReviews
);

router.get(
  '/order/:orderId',
  auth(UserRole.CUSTOMER),
  ReviewController.getReviewByOrder
);

router.get(
  '/admin/all-reviews',
  auth(UserRole.ADMIN),
  ReviewController.getAllReviews
);

export const ReviewRoutes = router;
