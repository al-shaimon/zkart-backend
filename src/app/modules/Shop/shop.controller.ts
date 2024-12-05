import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { ShopService } from './shop.service';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import pick from '../../../shared/pick';
import { IAuthUser } from '../../interfaces/common';

const createShop = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Vendor information not found');
  }

  const result = await ShopService.createShop(req, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Shop created successfully',
    data: result,
  });
});

const getAllShops = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['searchTerm', 'vendorId']);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await ShopService.getAllShops(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shops retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getShopById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ShopService.getShopById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop retrieved successfully',
    data: result,
  });
});

const updateShop = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params;
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User information not found');
  }

  const result = await ShopService.updateShop(req, id, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop updated successfully',
    data: result,
  });
});

const deleteShop = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params;
  const vendorId = req.user?.id;

  const result = await ShopService.deleteShop(id, vendorId!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop deleted successfully',
    data: result,
  });
});

const getMyShop = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userEmail = req.user?.email;
  console.log(userEmail);

  if (!userEmail) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User information not found');
  }

  const result = await ShopService.getMyShop(userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop retrieved successfully',
    data: result,
  });
});

export const ShopController = {
  createShop,
  getAllShops,
  getShopById,
  updateShop,
  deleteShop,
  getMyShop,
};
