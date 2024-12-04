import express, { NextFunction, Request, Response } from 'express';
import { CategoryController } from './category.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpers/fileUploader';

const router = express.Router();

router.get('/', CategoryController.getAllCategories);

router.get('/:id', CategoryController.getCategoryById);

router.post(
  '/',
  auth(UserRole.ADMIN),
  fileUploader.upload.single('image'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = JSON.parse(req.body.data);
      return CategoryController.createCategory(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id',
  auth(UserRole.ADMIN),
  fileUploader.upload.single('image'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.data) {
        req.body = JSON.parse(req.body.data);
      }
      return CategoryController.updateCategory(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', auth(UserRole.ADMIN), CategoryController.deleteCategory);

export const CategoryRoutes = router;
