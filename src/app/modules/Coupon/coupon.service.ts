import { Coupon, Prisma } from '@prisma/client';
import prisma from '../../../shared/prisma';
import { ICouponCreate, ICouponFilters } from './coupon.interface';
import { IPaginationOptions } from '../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { couponSearchableFields } from './coupon.constant';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';

const createCoupon = async (
  payload: ICouponCreate,
  userEmail: string,
  userRole: string
): Promise<Coupon> => {
  // Check if coupon code already exists for the same shop
  const existingCoupon = await prisma.coupon.findFirst({
    where: { code: payload.code, shopId: payload.shopId },
  });

  if (existingCoupon) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon code already exists for this shop');
  }

  // If the user is a vendor, ensure they are creating a coupon for their own shop
  if (userRole === 'VENDOR') {
    const vendor = await prisma.vendor.findUnique({
      where: { email: userEmail },
      include: { shops: true },
    });

    if (!vendor || !vendor.shops.some((shop) => shop.id === payload.shopId)) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'You are not authorized to create a coupon for this shop'
      );
    }
  }

  const result = await prisma.coupon.create({
    data: payload,
  });

  return result;
};

const getAllCoupons = async (filters: ICouponFilters, options: IPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: couponSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.CouponWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.coupon.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = await prisma.coupon.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getCouponByCode = async (code: string): Promise<Coupon | null> => {
  return await prisma.coupon.findUnique({
    where: { code },
  });
};

const updateCoupon = async (
  id: string,
  payload: Partial<ICouponCreate>,
  userEmail: string,
  userRole: string
): Promise<Coupon> => {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: {
      shop: {
        include: {
          vendor: true,
        },
      },
    },
  });

  if (!coupon) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Coupon not found');
  }

  // For vendor, check if the coupon belongs to their shop
  if (userRole === 'VENDOR') {
    if (coupon.shop.vendor.email !== userEmail) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this coupon');
    }
  }

  const result = await prisma.coupon.update({
    where: { id },
    data: payload,
  });

  return result;
};

const deleteCoupon = async (id: string, userEmail: string, userRole: string): Promise<Coupon> => {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: {
      shop: {
        include: {
          vendor: true,
        },
      },
    },
  });

  if (!coupon) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Coupon not found');
  }

  // For vendor, check if the coupon belongs to their shop
  if (userRole === 'VENDOR') {
    if (coupon.shop.vendor.email !== userEmail) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this coupon');
    }
  }

  const result = await prisma.coupon.delete({
    where: { id },
  });

  return result;
};

const getVendorCoupons = async (
  userEmail: string,
  filters: ICouponFilters,
  options: IPaginationOptions
) => {
  console.log('Vendor Email:', userEmail); // Debug log

  // Find vendor and their shops
  const vendor = await prisma.vendor.findUnique({
    where: { email: userEmail },
    include: { shops: true },
  });

  console.log('Found Vendor:', vendor); // Debug log

  if (!vendor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor not found');
  }

  const shopIds = vendor.shops.map((shop) => shop.id);
  console.log('Shop IDs:', shopIds); // Debug log

  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const whereConditions: Prisma.CouponWhereInput = {
    AND: [
      {
        shopId: {
          in: shopIds,
        },
      },
      // Add searchTerm condition if it exists
      ...(searchTerm
        ? [
            {
              OR: couponSearchableFields.map((field) => ({
                [field]: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              })),
            },
          ]
        : []),
      // Add other filters if they exist
      ...(Object.keys(filterData).length > 0
        ? [
            {
              AND: Object.keys(filterData).map((key) => ({
                [key]: {
                  equals: (filterData as any)[key],
                },
              })),
            },
          ]
        : []),
    ],
  };

  console.log('Where Conditions:', JSON.stringify(whereConditions, null, 2)); // Debug log

  const result = await prisma.coupon.findMany({
    where: whereConditions,
    include: {
      shop: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log('Found Coupons:', result); // Debug log

  const total = await prisma.coupon.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getVendorCouponById = async (id: string, userEmail: string): Promise<Coupon> => {
  // Find vendor and their shops
  const vendor = await prisma.vendor.findUnique({
    where: { email: userEmail },
    include: { shops: true },
  });

  if (!vendor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor not found');
  }

  const shopIds = vendor.shops.map((shop) => shop.id);

  const coupon = await prisma.coupon.findFirst({
    where: {
      id,
      shopId: {
        in: shopIds,
      },
    },
    include: {
      shop: {
        select: {
          id: true,
          name: true,
          logo: true,
        },
      },
    },
  });

  if (!coupon) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Coupon not found or unauthorized');
  }

  return coupon;
};

export const CouponService = {
  createCoupon,
  getAllCoupons,
  getCouponByCode,
  updateCoupon,
  deleteCoupon,
  getVendorCoupons,
  getVendorCouponById,
};
