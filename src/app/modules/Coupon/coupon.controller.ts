import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import pick from '../../../shared/pick';
import { CouponService } from './coupon.service';
import { couponFilterableFields } from './coupon.constant';
import ApiError from '../../errors/ApiError';

const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;
  const userRole = req.user?.role;

  if (!userEmail || !userRole) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await CouponService.createCoupon(req.body, userEmail, userRole);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Coupon created successfully',
    data: result,
  });
});

const getAllCoupons = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, couponFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await CouponService.getAllCoupons(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupons retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getCouponByCode = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.getCouponByCode(req.params.code);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon retrieved successfully',
    data: result,
  });
});

const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;
  const userRole = req.user?.role;

  if (!userEmail || !userRole) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await CouponService.updateCoupon(
    req.params.id,
    req.body,
    userEmail,
    userRole
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon updated successfully',
    data: result,
  });
});

const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;
  const userRole = req.user?.role;

  if (!userEmail || !userRole) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await CouponService.deleteCoupon(
    req.params.id,
    userEmail,
    userRole
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon deleted successfully',
    data: result,
  });
});

const getVendorCoupons = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const filters = pick(req.query, couponFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  
  const result = await CouponService.getVendorCoupons(userEmail, filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vendor coupons retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const CouponController = {
  createCoupon,
  getAllCoupons,
  getCouponByCode,
  updateCoupon,
  deleteCoupon,
  getVendorCoupons,
};
