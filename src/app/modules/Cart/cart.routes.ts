import express from 'express';
import { CartController } from './cart.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import validateRequest from '../../middlewares/validateRequest';
import { CartValidation } from './cart.validation';

const router = express.Router();

router.get('/', auth(UserRole.CUSTOMER), CartController.getCart);

router.post(
  '/add-to-cart',
  auth(UserRole.CUSTOMER),
  validateRequest(CartValidation.addToCart),
  CartController.addToCart
);

router.patch(
  '/item/:id',
  auth(UserRole.CUSTOMER),
  validateRequest(CartValidation.updateCartItem),
  CartController.updateCartItem
);

router.delete('/item/:id', auth(UserRole.CUSTOMER), CartController.removeCartItem);

router.delete('/clear', auth(UserRole.CUSTOMER), CartController.clearCart);

export const CartRoutes = router;
