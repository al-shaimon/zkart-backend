import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { ContactService } from './contact.service';

const submitContactForm = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactService.submitContactForm(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contact form submitted successfully',
    data: result,
  });
});

export const ContactController = {
  submitContactForm,
};
