import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { ShopFollowerService } from './shopFollower.service';
import ApiError from '../../errors/ApiError';

const followShop = catchAsync(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  await ShopFollowerService.followShop(shopId, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop followed successfully',
    data: null,
  });
});

const unfollowShop = catchAsync(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  await ShopFollowerService.unfollowShop(shopId, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop unfollowed successfully',
    data: null,
  });
});

const getFollowedShops = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await ShopFollowerService.getFollowedShops(userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Followed shops retrieved successfully',
    data: result,
  });
});

const getShopFollowers = catchAsync(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  const vendorEmail = req.user?.email;

  if (!vendorEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await ShopFollowerService.getShopFollowers(shopId, vendorEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop followers retrieved successfully',
    data: result,
  });
});

export const ShopFollowerController = {
  followShop,
  unfollowShop,
  getFollowedShops,
  getShopFollowers,
}; 