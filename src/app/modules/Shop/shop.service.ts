import { Prisma, Shop } from '@prisma/client';
import prisma from '../../../shared/prisma';
import { Request } from 'express';
import { fileUploader } from '../../../helpers/fileUploader';
import { IShopCreate, IShopFilters, IShopUpdate } from './shop.interface';
import { IPaginationOptions } from '../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';

const createShop = async (req: Request, userEmail: string): Promise<Shop> => {
  // First, get the vendor information using the email
  const vendor = await prisma.vendor.findUnique({
    where: {
      email: userEmail,
      isDeleted: false
    }
  });

  if (!vendor) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Vendor information not found');
  }

  // Check if vendor already has a shop
  const existingShop = await prisma.shop.findFirst({
    where: {
      vendorId: vendor.id,
      isDeleted: false
    }
  });

  if (existingShop) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Vendor already has a shop');
  }

  // Handle file upload
  const file = req.file;
  let logoUrl = null;

  if (file) {
    const uploadedImage = await fileUploader.uploadToCloudinary(file);
    logoUrl = uploadedImage?.secure_url;
  }

  // Parse the shop data from the request body
  let shopData;
  try {
    shopData = {
      name: req.body.name,
      description: req.body.description,
      logo: logoUrl,
      vendorId: vendor.id
    };
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid shop data format');
  }

  const result = await prisma.shop.create({
    data: shopData,
    include: {
      vendor: true
    }
  });

  return result;
};

const getAllShops = async (filters: IShopFilters, options: IPaginationOptions) => {
  const { searchTerm, ...filterData } = filters;
  const { limit, page, skip } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.ShopWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
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

  andConditions.push({
    isDeleted: false,
  });

  const whereConditions: Prisma.ShopWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.shop.findMany({
    where: whereConditions,
    skip,
    take: limit,
    include: {
      vendor: true,
      products: {
        where: { isDeleted: false },
      },
      followers: {
        include: {
          customer: true,
        },
      },
    },
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: 'desc' },
  });

  const total = await prisma.shop.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getShopById = async (id: string): Promise<Shop> => {
  const result = await prisma.shop.findUnique({
    where: { id, isDeleted: false },
    include: {
      vendor: true,
      products: {
        where: { isDeleted: false },
      },
      followers: {
        include: {
          customer: true,
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  return result;
};

const updateShop = async (
  req: Request,
  shopId: string,
  userEmail: string
): Promise<Shop> => {
  // First, get the vendor information using the email
  const vendor = await prisma.vendor.findUnique({
    where: {
      email: userEmail,
      isDeleted: false
    }
  });

  if (!vendor) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Vendor information not found');
  }

  // Check if the shop exists and belongs to the vendor
  const existingShop = await prisma.shop.findFirst({
    where: {
      id: shopId,
      vendorId: vendor.id,
      isDeleted: false
    }
  });

  if (!existingShop) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Shop not found or you do not have permission to update this shop'
    );
  }

  // Handle file upload if there's a new logo
  let logoUrl = existingShop.logo; // Keep existing logo by default
  const file = req.file;

  if (file) {
    const uploadedImage = await fileUploader.uploadToCloudinary(file);
    logoUrl = uploadedImage?.secure_url;
  }

  // Parse the shop data from the request body
  let updateData;
  try {
    const parsedData = req.body;
    updateData = {
      name: parsedData.name || existingShop.name,
      description: parsedData.description || existingShop.description,
      logo: logoUrl
    };
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid shop data format');
  }

  const result = await prisma.shop.update({
    where: {
      id: shopId
    },
    data: updateData,
    include: {
      vendor: true
    }
  });

  return result;
};

const deleteShop = async (id: string, vendorId: string): Promise<Shop> => {
  // Verify shop belongs to vendor
  const shop = await prisma.shop.findFirst({
    where: {
      id,
      vendorId,
      isDeleted: false,
    },
  });

  if (!shop) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete your own shop');
  }

  // Soft delete shop and all its products
  const result = await prisma.$transaction(async (tx) => {
    // Soft delete all products
    await tx.product.updateMany({
      where: { shopId: id },
      data: { isDeleted: true },
    });

    // Soft delete shop
    const deletedShop = await tx.shop.update({
      where: { id },
      data: { isDeleted: true },
    });

    return deletedShop;
  });

  return result;
};

const getMyShop = async (userEmail: string): Promise<Shop> => {
  // First, get the vendor information using the email
  const vendor = await prisma.vendor.findUnique({
    where: {
      email: userEmail,
      isDeleted: false
    }
  });

  if (!vendor) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Vendor information not found');
  }

  // Get the vendor's shop
  const shop = await prisma.shop.findFirst({
    where: {
      vendorId: vendor.id,
      isDeleted: false
    },
    include: {
      vendor: true,
      products: {
        where: {
          isDeleted: false
        },
        include: {
          category: true,
          reviews: {
            include: {
              customer: true
            }
          }
        }
      },
      followers: {
        include: {
          customer: true
        }
      }
    }
  });

  if (!shop) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shop not found');
  }

  return shop;
};

export const ShopService = {
  createShop,
  getAllShops,
  getShopById,
  updateShop,
  deleteShop,
  getMyShop
};
