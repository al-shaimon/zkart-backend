import express from 'express';
import { ShopFollowerController } from './shopFollower.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post(
  '/follow/:shopId',
  auth(UserRole.CUSTOMER),
  ShopFollowerController.followShop
);

router.delete(
  '/unfollow/:shopId',
  auth(UserRole.CUSTOMER),
  ShopFollowerController.unfollowShop
);

router.get(
  '/followed-shops',
  auth(UserRole.CUSTOMER),
  ShopFollowerController.getFollowedShops
);

router.get(
  '/shop/:shopId/followers',
  auth(UserRole.VENDOR),
  ShopFollowerController.getShopFollowers
);

export const ShopFollowerRoutes = router; 