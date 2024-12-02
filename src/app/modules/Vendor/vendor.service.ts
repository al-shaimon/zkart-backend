import { Prisma, UserStatus, Vendor } from '@prisma/client';
import prisma from '../../../shared/prisma';
import { IVendorFilterRequest, IVendorUpdate } from './vendor.interface';
import { IPaginationOptions } from '../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { vendorSearchableFields } from './vendor.constants';

const getAllFromDB = async (filters: IVendorFilterRequest, options: IPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.VendorWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: vendorSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    const filterConditions = Object.keys(filterData).map((key) => ({
      [key]: {
        equals: (filterData as any)[key],
      },
    }));
    andConditions.push(...filterConditions);
  }

  andConditions.push({
    isDeleted: false,
  });

  const whereConditions: Prisma.VendorWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.vendor.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: 'desc' },
    include: {
      shops: true,
    },
  });

  const total = await prisma.vendor.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const getByIdFromDB = async (id: string): Promise<Vendor | null> => {
  const result = await prisma.vendor.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      shops: true,
    },
  });

  return result;
};

const updateIntoDB = async (id: string, payload: IVendorUpdate) => {
  const { ...vendorData } = payload;

  const vendorInfo = await prisma.vendor.findUniqueOrThrow({
    where: {
      id,
    },
  });

  await prisma.$transaction(async (transactionClient) => {
    await transactionClient.vendor.update({
      where: {
        id,
      },
      data: vendorData,
    });
  });

  const result = await prisma.vendor.findUnique({
    where: {
      id: vendorInfo.id,
    },
    include: {
      shops: true,
    },
  });

  return result;
};

const deleteFromDB = async (id: string): Promise<Vendor> => {
  return await prisma.$transaction(async (transactionClient) => {
    const deleteVendor = await transactionClient.vendor.delete({
      where: {
        id,
      },
    });

    await transactionClient.user.delete({
      where: {
        email: deleteVendor.email,
      },
    });

    return deleteVendor;
  });
};

const softDelete = async (id: string): Promise<Vendor> => {
  return await prisma.$transaction(async (transactionClient) => {
    const deleteVendor = await transactionClient.vendor.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });

    await transactionClient.user.update({
      where: {
        email: deleteVendor.email,
      },
      data: {
        status: UserStatus.DELETED,
      },
    });

    return deleteVendor;
  });
};

export const VendorService = {
  getAllFromDB,
  getByIdFromDB,
  updateIntoDB,
  deleteFromDB,
  softDelete,
};
