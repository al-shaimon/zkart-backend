import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { ComparisonService } from './comparison.service';
import ApiError from '../../errors/ApiError';

const getComparisonList = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;
  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await ComparisonService.getComparisonList(userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comparison list retrieved successfully',
    data: result,
  });
});

const addToCompare = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;
  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  await ComparisonService.addToCompare(req.body, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product added to comparison successfully',
    data: null,
  });
});

const removeFromCompare = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;
  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  await ComparisonService.removeFromCompare(req.params.productId, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product removed from comparison successfully',
    data: null,
  });
});

export const ComparisonController = {
  getComparisonList,
  addToCompare,
  removeFromCompare,
}; 