import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { NewsletterService } from './newsletter.service';

const subscribe = catchAsync(async (req: Request, res: Response) => {
  const result = await NewsletterService.subscribe(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Successfully subscribed to newsletter',
    data: result,
  });
});

const getAllSubscribers = catchAsync(async (req: Request, res: Response) => {
  const result = await NewsletterService.getAllSubscribers();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Newsletter subscribers retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const NewsletterController = {
  subscribe,
  getAllSubscribers,
};
