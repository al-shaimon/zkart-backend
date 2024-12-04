import { Order, OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';
import { IOrderCreate, IOrderFilters, IOrderResponse, IOrderItemCreate } from './order.interface';
import { IPaginationOptions } from '../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { orderSearchableFields } from './order.constant';

const createOrder = async (payload: IOrderCreate, userEmail: string): Promise<IOrderResponse> => {
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail, isDeleted: false },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const cart = await prisma.cart.findFirst({
    where: { customerId: customer.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      shop: true,
    },
  });

  if (!cart || !cart.items.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cart is empty');
  }

  let totalAmount = 0;
  const orderItems: IOrderItemCreate[] = cart.items.map((item) => {
    if (item.product.stock < item.quantity) {
      throw new ApiError(httpStatus.BAD_REQUEST, `${item.product.name} is out of stock`);
    }
    const itemTotal = item.product.price * item.quantity;
    totalAmount += itemTotal;
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: item.product.price,
    };
  });

  let discount = 0;
  if (payload.couponId) {
    const coupon = await prisma.coupon.findUnique({
      where: {
        id: payload.couponId,
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
    });

    if (!coupon) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired coupon');
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon usage limit exceeded');
    }

    discount = Math.min((totalAmount * coupon.discount) / 100, coupon.usageLimit || totalAmount);
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        customerId: customer.id,
        shopId: cart.shop.id,
        totalAmount,
        discount,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: payload.paymentMethod,
        paymentId: null,
        couponId: payload.couponId || null,
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            contactNumber: true,
            address: true,
          },
        },
        coupon: true,
      },
    });

    if (payload.couponId) {
      await tx.coupon.update({
        where: { id: payload.couponId },
        data: { usageCount: { increment: 1 } },
      });
    }

    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    await tx.cart.delete({
      where: { id: cart.id },
    });

    return order;
  });

  return result;
};

const getAllOrders = async (filters: IOrderFilters, options: IPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: orderSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.OrderWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.order.findMany({
    where: whereConditions,
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          contactNumber: true,
          address: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = await prisma.order.count({
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

const getMyOrders = async (
  filters: IOrderFilters,
  options: IPaginationOptions,
  userEmail: string
) => {
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail, isDeleted: false },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.OrderWhereInput[] = [
    {
      customerId: customer.id,
    },
  ];

  if (searchTerm) {
    andConditions.push({
      OR: orderSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })) as Prisma.OrderWhereInput[],
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

  const whereConditions: Prisma.OrderWhereInput = { AND: andConditions };

  const result = await prisma.order.findMany({
    where: whereConditions,
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          contactNumber: true,
          address: true,
        },
      },
      shop: {
        select: {
          id: true,
          name: true,
        },
      },
      coupon: true,
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = await prisma.order.count({
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

const getOrderById = async (
  id: string,
  userEmail: string,
  userRole: string
): Promise<IOrderResponse> => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
              shop: {
                include: {
                  vendor: true,
                },
              },
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          contactNumber: true,
          address: true,
        },
      },
      coupon: true,
    },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // For ADMIN, allow access to all orders
  if (userRole === 'ADMIN') {
    return order;
  }

  // For VENDOR, check if the order belongs to their shop
  if (userRole === 'VENDOR') {
    const shopVendorEmail = order.orderItems[0]?.product.shop.vendor.email;
    if (shopVendorEmail !== userEmail) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'You are not authorized to view this order'
      );
    }
    return order;
  }

  // For CUSTOMER, check if the order belongs to them
  if (userRole === 'CUSTOMER') {
    const customer = await prisma.customer.findUnique({
      where: { email: userEmail },
    });

    if (order.customerId !== customer?.id) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'You are not authorized to view this order'
      );
    }
    return order;
  }

  throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to view this order');
};

const updateOrderStatus = async (
  id: string,
  status: OrderStatus,
  vendorEmail: string
): Promise<IOrderResponse> => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              shop: {
                include: {
                  vendor: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  const shopVendorEmail = order.orderItems[0]?.product.shop.vendor.email;
  if (shopVendorEmail !== vendorEmail) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this order');
  }

  const result = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          contactNumber: true,
          address: true,
        },
      },
      coupon: true,
    },
  });

  return result;
};

const getVendorOrders = async (
  vendorEmail: string,
  filters: IOrderFilters,
  options: IPaginationOptions
) => {
  const vendor = await prisma.vendor.findUnique({
    where: { email: vendorEmail },
    include: {
      shops: true,
    },
  });

  if (!vendor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor not found');
  }

  const shopIds = vendor.shops.map((shop) => shop.id);

  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.OrderWhereInput[] = [
    {
      shopId: {
        in: shopIds,
      },
    },
  ];

  if (searchTerm) {
    andConditions.push({
      OR: orderSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })) as Prisma.OrderWhereInput[],
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

  const whereConditions: Prisma.OrderWhereInput = { AND: andConditions };

  const result = await prisma.order.findMany({
    where: whereConditions,
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          contactNumber: true,
          address: true,
        },
      },
      shop: true,
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = await prisma.order.count({
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

export const OrderService = {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getVendorOrders,
};
