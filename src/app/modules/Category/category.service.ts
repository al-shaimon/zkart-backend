import { Category, Prisma } from '@prisma/client';
import prisma from '../../../shared/prisma';
import { ICategoryCreate, ICategoryFilters, ICategoryUpdate } from './category.interface';
import { IPaginationOptions } from '../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';

const createCategory = async (data: ICategoryCreate): Promise<Category> => {
  const result = await prisma.category.create({
    data,
  });
  return result;
};

const getAllCategories = async (filters: ICategoryFilters, options: IPaginationOptions) => {
  const { searchTerm } = filters;
  const { limit, page, skip } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.CategoryWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  andConditions.push({
    isDeleted: false,
  });

  const whereConditions: Prisma.CategoryWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.category.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: 'desc' },
  });

  const total = await prisma.category.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getCategoryById = async (id: string): Promise<Category> => {
  const result = await prisma.category.findUnique({
    where: { id, isDeleted: false },
    include: {
      products: {
        where: { isDeleted: false },
      },
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  return result;
};

const updateCategory = async (id: string, payload: ICategoryUpdate): Promise<Category> => {
  const result = await prisma.category.update({
    where: { id },
    data: payload,
  });

  return result;
};

const deleteCategory = async (id: string): Promise<Category> => {
  // Soft delete
  const result = await prisma.category.update({
    where: { id },
    data: { isDeleted: true },
  });

  return result;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
