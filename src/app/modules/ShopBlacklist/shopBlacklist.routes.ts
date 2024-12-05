import express from 'express';
import { ShopBlacklistController } from './shopBlacklist.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import validateRequest from '../../middlewares/validateRequest';
import { ShopBlacklistValidation } from './shopBlacklist.validation';

const router = express.Router();

router.post(
  '/blacklist',
  auth(UserRole.ADMIN),
  validateRequest(ShopBlacklistValidation.create),
  ShopBlacklistController.blacklistShop
);

router.delete(
  '/blacklist/:shopId',
  auth(UserRole.ADMIN),
  ShopBlacklistController.removeFromBlacklist
);

router.get(
  '/blacklisted-shops',
  auth(UserRole.ADMIN),
  ShopBlacklistController.getAllBlacklistedShops
);

export const ShopBlacklistRoutes = router; 