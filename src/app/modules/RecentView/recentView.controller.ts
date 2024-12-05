import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { RecentViewService } from './recentView.service';
import ApiError from '../../errors/ApiError';

const addRecentView = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.body;
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  await RecentViewService.addRecentView(productId, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product view recorded successfully',
    data: null
  });
});

const getRecentViews = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await RecentViewService.getRecentViews(userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Recent views retrieved successfully',
    data: result,
  });
});

export const RecentViewController = {
  addRecentView,
  getRecentViews,
}; 