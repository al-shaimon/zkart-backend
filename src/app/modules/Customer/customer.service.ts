import { Customer, Prisma, UserStatus } from '@prisma/client';
import prisma from '../../../shared/prisma';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { customerSearchableFields } from './customer.constants';
import { ICustomerFilterRequest, ICustomerUpdate } from './customer.interface';
import { IPaginationOptions } from '../../interfaces/pagination';

const getAllFromDB = async (filters: ICustomerFilterRequest, options: IPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.CustomerWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: customerSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => {
        return {
          [key]: {
            equals: (filterData as any)[key],
          },
        };
      }),
    });
  }
  andConditions.push({
    isDeleted: false,
  });

  const whereConditions: Prisma.CustomerWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.customer.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: 'desc',
          },
    // include: {
    // HAVE TO INCLUDE CUSTOMER RELATED TABLES
    // },
  });
  const total = await prisma.customer.count({
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

const getByIdFromDB = async (id: string): Promise<Customer | null> => {
  const result = await prisma.customer.findUnique({
    where: {
      id,
      isDeleted: false,
    },
    // include: {
    // HAVE TO INCLUDE CUSTOMER RELATED TABLES
    // },
  });
  return result;
};

const updateIntoDB = async (
  id: string,
  payload: Partial<ICustomerUpdate>
): Promise<Customer | null> => {
  const { ...customerData } = payload;

  const customerInfo = await prisma.customer.findUniqueOrThrow({
    where: {
      id,
    },
  });

  await prisma.$transaction(async (transactionClient) => {
    // Update customer data
    await transactionClient.customer.update({
      where: {
        id,
        isDeleted: false,
      },
      data: customerData,
      // include: {
      // HAVE TO INCLUDE CUSTOMER RELATED TABLES
      // },
    });

    // WILL UPDATE CUSTOMER RELATED TABLES
  });

  const responseData = await prisma.customer.findUnique({
    where: {
      id: customerInfo.id,
    },
    // include: {
    // HAVE TO INCLUDE CUSTOMER RELATED TABLES
    // },
  });
  return responseData;
};

const deleteFromDB = async (id: string): Promise<Customer | null> => {
  const result = await prisma.$transaction(async (tx) => {
    // WILL DELETE CUSTOMER RELATED TABLES

    // delete customer
    const deletedCustomer = await tx.customer.delete({
      where: {
        id,
      },
    });

    // delete user
    await tx.user.delete({
      where: {
        email: deletedCustomer.email,
      },
    });

    return deletedCustomer;
  });

  return result;
};

const softDelete = async (id: string): Promise<Customer | null> => {
  return await prisma.$transaction(async (tx) => {
    const deletedCustomer = await tx.customer.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });

    await tx.user.update({
      where: {
        email: deletedCustomer.email,
      },
      data: {
        status: UserStatus.DELETED,
      },
    });

    return deletedCustomer;
  });
};

export const CustomerService = {
  getAllFromDB,
  getByIdFromDB,
  updateIntoDB,
  deleteFromDB,
  softDelete,
};
