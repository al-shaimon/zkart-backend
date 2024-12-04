import { Admin, Customer, Prisma, UserRole, UserStatus, Vendor } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import prisma from '../../../shared/prisma';
import { fileUploader } from '../../../helpers/fileUploader';
import { Request } from 'express';
import { IPaginationOptions } from '../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { userSearchAbleFields } from './user.constant';
import { IAuthUser } from '../../interfaces/common';
const createAdmin = async (req: Request): Promise<Admin> => {
  const file = req.file as Express.Multer.File | undefined;
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);

    req.body.admin.profilePhoto = uploadToCloudinary?.secure_url;
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 12);

  const userData = {
    email: req.body.admin.email,
    password: hashedPassword,
    role: UserRole.ADMIN,
  };

  const result = await prisma.$transaction(async (transactionClient) => {
    await transactionClient.user.create({
      data: userData,
    });

    const createdAdminData = await transactionClient.admin.create({
      data: req.body.admin,
    });

    return createdAdminData;
  });

  return result;
};

const createVendor = async (req: Request): Promise<Vendor> => {
  const file = req.file as Express.Multer.File | undefined;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);

    req.body.vendor.profilePhoto = uploadToCloudinary?.secure_url;
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 12);

  const userData = {
    email: req.body.vendor.email,
    password: hashedPassword,
    role: UserRole.VENDOR,
  };

  const result = await prisma.$transaction(async (transactionClient) => {
    await transactionClient.user.create({
      data: userData,
    });

    const createdVendorData = await transactionClient.vendor.create({
      data: req.body.vendor,
    });

    return createdVendorData;
  });

  return result;
};

const createCustomer = async (req: Request): Promise<Customer> => {
  const file = req.file as Express.Multer.File | undefined;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);

    req.body.customer.profilePhoto = uploadToCloudinary?.secure_url;
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 12);

  const userData = {
    email: req.body.customer.email,
    password: hashedPassword,
    role: UserRole.CUSTOMER,
  };

  const result = await prisma.$transaction(async (transactionClient) => {
    await transactionClient.user.create({
      data: userData,
    });

    const createdCustomerData = await transactionClient.customer.create({
      data: req.body.customer,
    });

    return createdCustomerData;
  });

  return result;
};

const getAllFromDB = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;
  const andConditions: Prisma.UserWhereInput[] = [];

  if (params.searchTerm) {
    andConditions.push({
      OR: userSearchAbleFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
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

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: 'desc',
          },
    include: {
      admin: true,
      vendor: true,
      customer: true,
    },
  });

  const transformedResult = result.map((user) => {
    const { admin, vendor, customer, ...userData } = user;
    let roleSpecificData = null;

    if (user.role === UserRole.ADMIN) {
      roleSpecificData = admin;
    } else if (user.role === UserRole.VENDOR) {
      roleSpecificData = vendor;
    } else if (user.role === UserRole.CUSTOMER) {
      roleSpecificData = customer;
    }

    return {
      ...userData,
      profile: roleSpecificData,
    };
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: transformedResult,
  };
};

const changeProfileStatus = async (id: string, status: UserRole) => {
  await prisma.user.findUniqueOrThrow({
    where: {
      id,
    },
  });

  const updateUserStatus = await prisma.user.update({
    where: {
      id,
    },
    data: status,
  });

  return updateUserStatus;
};

const getMyProfile = async (user: IAuthUser) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user?.email,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
    },
  });

  let profileInfo;

  if (userInfo.role === UserRole.ADMIN) {
    profileInfo = await prisma.admin.findUnique({
      where: {
        email: userInfo.email,
      },
    });
  } else if (userInfo.role === UserRole.VENDOR) {
    profileInfo = await prisma.vendor.findUnique({
      where: {
        email: userInfo.email,
      },
    });
  } else if (userInfo.role === UserRole.CUSTOMER) {
    profileInfo = await prisma.customer.findUnique({
      where: {
        email: userInfo.email,
      },
    });
  }

  return { ...userInfo, ...profileInfo };
};

const updateMyProfile = async (user: IAuthUser, req: Request) => {
  const payload = req.body;

  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user?.email,
      status: UserStatus.ACTIVE,
    },
  });

  const file = req.file as Express.Multer.File | undefined;

  let profileInfo;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);

    req.body.profilePhoto = uploadToCloudinary?.secure_url;
  }

  if (userInfo.role === UserRole.ADMIN) {
    profileInfo = await prisma.admin.update({
      where: {
        email: userInfo.email,
      },
      data: payload,
    });
  } else if (userInfo.role === UserRole.VENDOR) {
    profileInfo = await prisma.vendor.update({
      where: {
        email: userInfo.email,
      },
      data: payload,
    });
  } else if (userInfo.role === UserRole.CUSTOMER) {
    profileInfo = await prisma.customer.update({
      where: {
        email: userInfo.email,
      },
      data: payload,
    });
  }

  return { ...profileInfo };
};

export const userService = {
  createAdmin,
  createVendor,
  createCustomer,
  getAllFromDB,
  changeProfileStatus,
  getMyProfile,
  updateMyProfile,
};
