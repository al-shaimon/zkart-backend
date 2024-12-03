import express from 'express';
import { ProductController } from './product.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpers/fileUploader';

const router = express.Router();

router.post(
  '/',
  auth(UserRole.VENDOR),
  fileUploader.upload.array('images', 5),
  ProductController.createProduct
);

router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);
router.patch(
  '/:id',
  auth(UserRole.VENDOR),
  fileUploader.upload.array('images', 5),
  ProductController.updateProduct
);
router.delete('/:id', auth(UserRole.VENDOR), ProductController.deleteProduct);

router.post('/duplicate/:id', auth(UserRole.VENDOR), ProductController.duplicateProduct);

export const ProductRoutes = router;
