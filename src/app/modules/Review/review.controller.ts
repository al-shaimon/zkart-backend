import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { ReviewService } from './review.service';
import pick from '../../../shared/pick';
import ApiError from '../../errors/ApiError';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await ReviewService.createReview(req.body, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});

const getProductReviews = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['rating']);
  const options = pick(req.query, ['limit', 'page']);
  const result = await ReviewService.getProductReviews(
    req.params.productId,
    filters,
    options
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product reviews retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getVendorProductReviews = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const filters = pick(req.query, ['rating']);
  const options = pick(req.query, ['limit', 'page']);
  
  const result = await ReviewService.getVendorProductReviews(
    userEmail,
    filters,
    options
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vendor product reviews retrieved successfully',
    meta: result.meta,
    data: result.data
  });
});

const getReviewByOrder = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;
  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await ReviewService.getReviewByOrder(req.params.orderId, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reviews retrieved successfully',
    data: result,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['rating']);
  const options = pick(req.query, ['limit', 'page']);
  
  const result = await ReviewService.getAllReviews(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All reviews retrieved successfully',
    meta: result.meta,
    data: result.data
  });
});

export const ReviewController = {
  createReview,
  getProductReviews,
  getVendorProductReviews,
  getReviewByOrder,
  getAllReviews,
}; 