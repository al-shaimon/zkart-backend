import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';
import { IShopBlacklistCreate, IShopBlacklistResponse } from './shopBlacklist.interface';

const blacklistShop = async (payload: IShopBlacklistCreate): Promise<IShopBlacklistResponse> => {
  const { shopId, reason } = payload;

  // Check if shop exists
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      ShopBlacklist: true,
    },
  });

  if (!shop) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  // Check if shop is already blacklisted
  if (shop.ShopBlacklist) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Shop is already blacklisted');
  }

  // Create blacklist entry
  const result = await prisma.shopBlacklist.create({
    data: {
      shopId,
      reason,
    },
    include: {
      shop: {
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const removeFromBlacklist = async (shopId: string): Promise<void> => {
  // Check if shop exists in blacklist
  const blacklistedShop = await prisma.shopBlacklist.findUnique({
    where: { shopId },
  });

  if (!blacklistedShop) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shop not found in blacklist');
  }

  // Remove from blacklist
  await prisma.shopBlacklist.delete({
    where: { shopId },
  });
};

const getAllBlacklistedShops = async () => {
  const blacklistedShops = await prisma.shopBlacklist.findMany({
    include: {
      shop: {
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      blacklistedAt: 'desc',
    },
  });

  return blacklistedShops;
};

export const ShopBlacklistService = {
  blacklistShop,
  removeFromBlacklist,
  getAllBlacklistedShops,
}; 