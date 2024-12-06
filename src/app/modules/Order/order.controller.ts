import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { OrderService } from './order.service';
import pick from '../../../shared/pick';
import { orderFilterableFields } from './order.constant';
import ApiError from '../../errors/ApiError';
import Stripe from 'stripe';
import config from '../../../config';

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await OrderService.createOrder(userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order created successfully',
    data: result,
  });
});

const applyCoupon = catchAsync(async (req: Request, res: Response) => {
  const { code } = req.body;
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await OrderService.applyCoupon(code, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon applied successfully',
    data: result,
  });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, orderFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await OrderService.getAllOrders(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Orders retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, orderFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await OrderService.getMyOrders(filters, options, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Orders retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;
  const userRole = req.user?.role;

  if (!userEmail || !userRole) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await OrderService.getOrderById(req.params.id, userEmail, userRole);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order retrieved successfully',
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await OrderService.updateOrderStatus(req.params.id, req.body.status, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order status updated successfully',
    data: result,
  });
});

const getVendorOrders = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const filters = pick(req.query, orderFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await OrderService.getVendorOrders(userEmail, filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Orders retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const webhook = catchAsync(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    throw new Error('Webhook Error: No Stripe signature found');
  }

  try {
    const stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2024-11-20.acacia',
    });

    const event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);

    await OrderService.handleStripeWebhook(event);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Webhook processed successfully',
      data: { received: true },
    });
  } catch (err: any) {
    throw new Error(`Webhook Error: ${err.message}`);
  }
});

export const OrderController = {
  createOrder,
  applyCoupon,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getVendorOrders,
  webhook,
};
