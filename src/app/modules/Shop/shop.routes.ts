import express, { NextFunction, Request, Response } from 'express';
import { ShopController } from './shop.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpers/fileUploader';

const router = express.Router();

router.get('/', ShopController.getAllShops);

router.get('/my-shop', auth(UserRole.VENDOR), ShopController.getMyShop);

router.get('/:id', ShopController.getShopById);

router.post(
  '/',
  auth(UserRole.VENDOR),
  fileUploader.upload.single('logo'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = JSON.parse(req.body.data);
      return ShopController.createShop(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id',
  auth(UserRole.VENDOR),
  fileUploader.upload.single('logo'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.data) {
        req.body = JSON.parse(req.body.data);
      }
      return ShopController.updateShop(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', auth(UserRole.VENDOR), ShopController.deleteShop);

export const ShopRoutes = router;
