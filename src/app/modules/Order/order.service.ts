import { Order, OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';
import {
  IOrderCreate,
  IOrderFilters,
  IOrderResponse,
  IOrderItemCreate,
  IOrderWithPayment,
  ICouponApplyResponse,
} from './order.interface';
import { IPaginationOptions } from '../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { orderSearchableFields } from './order.constant';
import Stripe from 'stripe';
import config from '../../../config';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2024-11-20.acacia',
});

const createOrder = async (userEmail: string): Promise<IOrderWithPayment> => {
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
      coupon: true,
    },
  });

  if (!cart || !cart.items.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cart is empty');
  }

  let totalAmount = cart.items.reduce((total, item) => {
    return total + item.quantity * item.product.price;
  }, 0);

  const discount = cart.discount;
  const finalAmount = totalAmount - discount;

  // Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(finalAmount * 100),
    currency: 'usd',
    metadata: {
      customerEmail: userEmail,
      cartId: cart.id,
    },
  });

  const result = await prisma.$transaction(async (tx) => {
    // Create the order
    const order = await tx.order.create({
      data: {
        customerId: customer.id,
        shopId: cart.shop.id,
        totalAmount: finalAmount,
        discount: cart.discount,
        couponId: cart.couponId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.STRIPE,
        paymentId: paymentIntent.id,
        orderItems: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
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

    // Update product stock
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Clear the cart including coupon
    await tx.cart.update({
      where: { id: cart.id },
      data: {
        couponId: null,
        discount: 0,
      },
    });
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return {
      order,
      clientSecret: paymentIntent.client_secret,
    };
  });

  return result;
};

const applyCoupon = async (code: string, userEmail: string): Promise<ICouponApplyResponse> => {
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail, isDeleted: false },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  // Find the active cart
  const cart = await prisma.cart.findFirst({
    where: {
      customerId: customer.id,
      isDeleted: false,
    },
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

  // Find the coupon
  const coupon = await prisma.coupon.findFirst({
    where: {
      code,
      isActive: true,
      shopId: cart.shopId,
      validFrom: { lte: new Date() },
      OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      AND: [
        {
          OR: [
            { usageLimit: null },
            {
              usageLimit: {
                gt: prisma.coupon.fields.usageCount,
              },
            },
          ],
        },
      ],
    },
  });

  if (!coupon) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired coupon');
  }

  // Calculate cart total and discount
  const cartTotal = cart.items.reduce((total, item) => {
    return total + item.quantity * item.product.price;
  }, 0);

  const calculatedDiscount = (cartTotal * coupon.discount) / 100;
  let finalDiscount = calculatedDiscount;
  let discountType: 'FLAT' | 'UPTO' = 'FLAT';
  let discountMessage = `${coupon.discount}% off on your order`;

  // Check if there's a usage limit and if it affects the discount
  if (coupon.usageLimit && calculatedDiscount > coupon.usageLimit) {
    finalDiscount = coupon.usageLimit;
    discountType = 'UPTO';
    discountMessage = `${coupon.discount}% off (up to ${coupon.usageLimit} ${config.currency})`;
  }

  const finalAmount = cartTotal - finalDiscount;

  // Store the coupon and discount in cart
  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      couponId: coupon.id,
      discount: finalDiscount,
    },
  });

  return {
    originalAmount: cartTotal,
    discount: finalDiscount,
    finalAmount,
    coupon: {
      code: coupon.code,
      discount: coupon.discount,
      usageLimit: coupon.usageLimit,
      discountType,
      discountMessage,
    },
  };
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
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to view this order');
    }
    return order;
  }

  // For CUSTOMER, check if the order belongs to them
  if (userRole === 'CUSTOMER') {
    const customer = await prisma.customer.findUnique({
      where: { email: userEmail },
    });

    if (order.customerId !== customer?.id) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to view this order');
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

// Add webhook handler in the same service
const handleStripeWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Update order status
      await prisma.order.update({
        where: { paymentId: paymentIntent.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.PROCESSING,
        },
      });
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      await prisma.order.update({
        where: { paymentId: paymentIntent.id },
        data: {
          paymentStatus: PaymentStatus.FAILED,
        },
      });
      break;
    }
  }
};

const updatePaymentStatus = async (
  paymentId: string,
  status: PaymentStatus
): Promise<IOrderResponse> => {
  const order = await prisma.order.findUnique({
    where: { paymentId },
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

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  const updatedOrder = await prisma.order.update({
    where: { paymentId },
    data: {
      paymentStatus: status,
      status: status === PaymentStatus.PAID ? OrderStatus.PROCESSING : OrderStatus.PENDING,
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

  return updatedOrder;
};

export const OrderService = {
  createOrder,
  applyCoupon,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getVendorOrders,
  handleStripeWebhook,
  updatePaymentStatus,
};
