import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { ShopBlacklistService } from './shopBlacklist.service';

const blacklistShop = catchAsync(async (req: Request, res: Response) => {
  const result = await ShopBlacklistService.blacklistShop(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop blacklisted successfully',
    data: result,
  });
});

const removeFromBlacklist = catchAsync(async (req: Request, res: Response) => {
  const { shopId } = req.params;
  await ShopBlacklistService.removeFromBlacklist(shopId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop removed from blacklist successfully',
    data: null,
  });
});

const getAllBlacklistedShops = catchAsync(async (req: Request, res: Response) => {
  const result = await ShopBlacklistService.getAllBlacklistedShops();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Blacklisted shops retrieved successfully',
    data: result,
  });
});

export const ShopBlacklistController = {
  blacklistShop,
  removeFromBlacklist,
  getAllBlacklistedShops,
}; 