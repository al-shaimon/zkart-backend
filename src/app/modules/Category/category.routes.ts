import express from 'express';
import { CategoryController } from './category.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpers/fileUploader';
import validateRequest from '../../middlewares/validateRequest';
import { CategoryValidation } from './category.validation';

const router = express.Router();

router.post(
  '/',
  auth(UserRole.ADMIN),
  fileUploader.upload.single('image'),
  validateRequest(CategoryValidation.create),
  CategoryController.createCategory
);

router.get('/', CategoryController.getAllCategories);

router.get('/:id', CategoryController.getCategoryById);

router.patch(
  '/:id',
  auth(UserRole.ADMIN),
  fileUploader.upload.single('image'),
  validateRequest(CategoryValidation.update),
  CategoryController.updateCategory
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN),
  CategoryController.deleteCategory
);

export const CategoryRoutes = router; 