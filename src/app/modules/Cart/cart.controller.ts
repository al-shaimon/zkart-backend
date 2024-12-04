import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { CartService } from './cart.service';
import ApiError from '../../errors/ApiError';

const addToCart = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await CartService.addToCart(req.body, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Item added to cart successfully',
    data: result,
  });
});

const getCart = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await CartService.getCart(userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cart retrieved successfully',
    data: result,
  });
});

const updateCartItem = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await CartService.updateCartItem(id, req.body, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cart item updated successfully',
    data: result,
  });
});

const removeCartItem = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  const result = await CartService.removeCartItem(id, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cart item removed successfully',
    data: result,
  });
});

const clearCart = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  await CartService.clearCart(userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cart cleared successfully',
    data: null,
  });
});

export const CartController = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
