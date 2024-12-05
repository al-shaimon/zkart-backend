import express, { NextFunction, Request, Response } from 'express';
import { ProductController } from './product.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpers/fileUploader';
import validateRequest from '../../middlewares/validateRequest';
import { ProductValidation } from './product.validation';

const router = express.Router();

router.get('/', ProductController.getAllProducts);

router.get('/flash-sale', ProductController.getFlashSaleProducts);

router.get('/:id', ProductController.getProductById);

router.post(
  '/',
  auth(UserRole.VENDOR),
  fileUploader.upload.array('images', 5),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = JSON.parse(req.body.data);
      return ProductController.createProduct(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id',
  auth(UserRole.VENDOR),
  fileUploader.upload.array('images', 5),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.data) {
        req.body = JSON.parse(req.body.data);
      }
      return ProductController.updateProduct(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', auth(UserRole.VENDOR), ProductController.deleteProduct);

router.post('/duplicate/:id', auth(UserRole.VENDOR), ProductController.duplicateProduct);

router.post(
  '/flash-sale',
  auth(UserRole.VENDOR),
  validateRequest(ProductValidation.createFlashSale),
  ProductController.createFlashSale
);

export const ProductRoutes = router;
