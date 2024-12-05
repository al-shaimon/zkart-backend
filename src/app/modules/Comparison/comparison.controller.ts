import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { ComparisonService } from './comparison.service';

const compareProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await ComparisonService.compareProducts(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Products compared successfully',
    data: result,
  });
});

export const ComparisonController = {
  compareProducts,
}; 