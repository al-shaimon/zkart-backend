import express, { NextFunction, Request, Response } from 'express';
import { userController } from './user.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpers/fileUploader';
import { userValidation } from './user.validation';
import validateRequest from '../../middlewares/validateRequest';

const router = express.Router();

router.get('/', auth(UserRole.ADMIN), userController.getAllFromDB);

router.get(
  '/me',
  auth(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER),
  userController.getMyProfile
);

router.post(
  '/create-admin',
  // auth(UserRole.ADMIN),
  fileUploader.upload.single('file'),

  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createAdmin.parse(JSON.parse(req.body.data));

    return userController.createAdmin(req, res, next);
  }
);

router.post(
  '/create-vendor',
  fileUploader.upload.single('file'),

  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createVendor.parse(JSON.parse(req.body.data));

    return userController.createVendor(req, res, next);
  }
);

router.post(
  '/create-customer',
  fileUploader.upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createCustomer.parse(JSON.parse(req.body.data));

    return userController.createCustomer(req, res, next);
  }
);

router.patch(
  '/:id/status',
  auth(UserRole.ADMIN),
  validateRequest(userValidation.updateStatus),
  userController.changeProfileStatus
);

router.patch(
  '/update-my-profile',
  auth(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER),
  fileUploader.upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = JSON.parse(req.body.data);

    return userController.updateMyProfile(req, res, next);
  }
);

export const UserRoutes = router;
