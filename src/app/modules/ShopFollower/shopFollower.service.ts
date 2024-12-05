import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';
import { IShopFollowerWithCustomer, IShopFollowersResponse } from './shopFollower.interface';

const followShop = async (shopId: string, userEmail: string): Promise<void> => {
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId, isDeleted: false },
  });

  if (!shop) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  // Check if already following
  const existingFollow = await prisma.shopFollower.findUnique({
    where: {
      shopId_customerId: {
        shopId: shopId,
        customerId: customer.id,
      },
    },
  });

  if (existingFollow) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Already following this shop');
  }

  await prisma.shopFollower.create({
    data: {
      shopId: shopId,
      customerId: customer.id,
    },
  });
};

const unfollowShop = async (shopId: string, userEmail: string): Promise<void> => {
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const existingFollow = await prisma.shopFollower.findUnique({
    where: {
      shopId_customerId: {
        shopId: shopId,
        customerId: customer.id,
      },
    },
  });

  if (!existingFollow) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Not following this shop');
  }

  await prisma.shopFollower.delete({
    where: {
      shopId_customerId: {
        shopId: shopId,
        customerId: customer.id,
      },
    },
  });
};

const getFollowedShops = async (userEmail: string) => {
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const followedShops = await prisma.shopFollower.findMany({
    where: {
      customerId: customer.id,
      shop: {
        isDeleted: false,
      },
    },
    include: {
      shop: {
        select: {
          id: true,
          name: true,
          logo: true,
          description: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return followedShops;
};

const getShopFollowers = async (
  shopId: string,
  vendorEmail: string
): Promise<IShopFollowersResponse> => {
  // First verify that the shop belongs to the vendor
  const vendor = await prisma.vendor.findUnique({
    where: { email: vendorEmail },
    include: {
      shops: {
        where: { id: shopId },
      },
    },
  });

  if (!vendor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor not found');
  }

  if (vendor.shops.length === 0) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You do not have permission to view followers for this shop'
    );
  }

  // Get total count
  const totalFollowers = await prisma.shopFollower.count({
    where: {
      shopId: shopId,
    },
  });

  // Get followers with details
  const followers = await prisma.shopFollower.findMany({
    where: {
      shopId: shopId,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    followers,
    totalFollowers,
  };
};

export const ShopFollowerService = {
  followShop,
  unfollowShop,
  getFollowedShops,
  getShopFollowers,
}; 