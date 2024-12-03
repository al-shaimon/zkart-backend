import { Prisma, Product } from '@prisma/client';
import prisma from '../../../shared/prisma';
import { IProductCreate, IProductFilters, IProductUpdate } from './product.interface';
import { IPaginationOptions } from '../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import ApiError from '../../errors/ApiError';

const createProduct = async (data: IProductCreate): Promise<Product> => {
  const result = await prisma.product.create({
    data,
    include: {
      category: true,
      shop: true,
      images: true,
    },
  });
  return result;
};

const getAllProducts = async (filters: IProductFilters, options: IPaginationOptions) => {
  const { searchTerm, minPrice, maxPrice, ...filterData } = filters;
  const { limit, page, skip } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.ProductWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (minPrice !== undefined) {
    andConditions.push({ price: { gte: minPrice } });
  }

  if (maxPrice !== undefined) {
    andConditions.push({ price: { lte: maxPrice } });
  }

  const whereConditions: Prisma.ProductWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.product.findMany({
    where: whereConditions,
    skip,
    take: limit,
    include: {
      category: true,
      shop: true,
      images: true,
      reviews: {
        include: {
          customer: true,
          response: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = await prisma.product.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getProductById = async (id: string) => {
  const result = await prisma.product.findUnique({
    where: { id, isDeleted: false },
    include: {
      category: true,
      shop: true,
      reviews: {
        include: {
          customer: true,
          response: true,
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  return result;
};

const updateProduct = async (
  id: string,
  vendorId: string,
  payload: IProductUpdate
): Promise<Product> => {
  // Verify product belongs to vendor
  const product = await prisma.product.findFirst({
    where: {
      id,
      shop: {
        vendorId,
      },
    },
  });

  if (!product) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only update your own products');
  }

  const result = await prisma.product.update({
    where: { id },
    data: payload,
    include: {
      category: true,
      shop: true,
    },
  });

  return result;
};

const deleteProduct = async (id: string, vendorId: string): Promise<Product> => {
  // Verify product belongs to vendor
  const product = await prisma.product.findFirst({
    where: {
      id,
      shop: {
        vendorId,
      },
    },
  });

  if (!product) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete your own products');
  }

  const result = await prisma.product.update({
    where: { id },
    data: { isDeleted: true },
  });

  return result;
};

const duplicateProduct = async (id: string, vendorId: string): Promise<Product> => {
  const product = await prisma.product.findFirst({
    where: {
      id,
      shop: {
        vendorId,
      },
    },
  });

  if (!product) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only duplicate your own products');
  }

  const { id: _, createdAt, updatedAt, ...productData } = product;

  const result = await prisma.product.create({
    data: {
      ...productData,
      name: `${productData.name} (Copy)`,
    },
    include: {
      category: true,
      shop: true,
    },
  });

  return result;
};

export const ProductService = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  duplicateProduct,
};
