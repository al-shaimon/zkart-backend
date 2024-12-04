import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { ProductService } from './product.service';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import pick from '../../../shared/pick';
import ApiError from '../../errors/ApiError';

const createProduct = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User information not found');
  }

  const result = await ProductService.createProduct(req, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Product created successfully',
    data: result,
  });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    'searchTerm',
    'categoryId',
    'minPrice',
    'maxPrice',
    'isFlashSale',
    'shopId',
  ]);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await ProductService.getAllProducts(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Products retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getProductById = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.getProductById(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product retrieved successfully',
    data: result,
  });
});

const updateProduct = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params;
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User information not found');
  }

  const result = await ProductService.updateProduct(req, id, userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product updated successfully',
    data: result,
  });
});

const deleteProduct = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await ProductService.deleteProduct(req.params.id, req.user.vendorId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product deleted successfully',
    data: result,
  });
});

const duplicateProduct = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await ProductService.duplicateProduct(req.params.id, req.user.vendorId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Product duplicated successfully',
    data: result,
  });
});

export const ProductController = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  duplicateProduct,
};
