import { Review, Prisma } from '@prisma/client';
import prisma from '../../../shared/prisma';
import { IReviewCreate, IReviewFilters, IReviewByOrderResponse } from './review.interface';
import { IPaginationOptions } from '../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';

const createReview = async (
  payload: IReviewCreate,
  userEmail: string
): Promise<Review> => {
  // Find customer
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  // Check if order exists and is delivered
  const order = await prisma.order.findUnique({
    where: {
      id: payload.orderId,
      customerId: customer.id,
      status: 'DELIVERED',
    },
    include: {
      orderItems: true,
    },
  });

  if (!order) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Order not found or not eligible for review'
    );
  }

  // Check if product was in the order
  const orderItem = order.orderItems.find(
    item => item.productId === payload.productId
  );

  if (!orderItem) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'You can only review products you have purchased'
    );
  }

  // Check if review already exists
  const existingReview = await prisma.review.findFirst({
    where: {
      productId: payload.productId,
      customerId: customer.id,
      orderId: payload.orderId,
    },
  });

  if (existingReview) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'You have already reviewed this product for this order'
    );
  }

  const result = await prisma.review.create({
    data: {
      ...payload,
      customerId: customer.id,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return result;
};

const getProductReviews = async (
  productId: string,
  filters: IReviewFilters,
  options: IPaginationOptions
) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);

  const whereConditions: Prisma.ReviewWhereInput = {
    productId,
  };

  const result = await prisma.review.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const total = await prisma.review.count({
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

const getVendorProductReviews = async (
  userEmail: string,
  filters: IReviewFilters,
  options: IPaginationOptions
) => {
  // Find vendor and their shops
  const vendor = await prisma.vendor.findUnique({
    where: { email: userEmail },
    include: {
      shops: {
        include: {
          products: {
            select: { id: true }
          }
        }
      }
    }
  });

  if (!vendor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor not found');
  }

  // Get all product IDs from vendor's shops
  const productIds = vendor.shops.flatMap(shop => 
    shop.products.map(product => product.id)
  );

  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, rating, ...filterData } = filters;

  const whereConditions: Prisma.ReviewWhereInput = {
    productId: {
      in: productIds
    }
  };

  // Add rating filter if provided
  if (rating) {
    whereConditions.rating = Number(rating);
  }

  const result = await prisma.review.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true
        }
      },
      product: {
        select: {
          id: true,
          name: true,
          shop: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  const total = await prisma.review.count({
    where: whereConditions
  });

  return {
    meta: {
      page,
      limit,
      total
    },
    data: result
  };
};

const getReviewByOrder = async (orderId: string, userEmail: string): Promise<IReviewByOrderResponse[]> => {
  // Find customer
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  // Get reviews for the order
  const reviews = await prisma.review.findMany({
    where: {
      orderId: orderId,
      customerId: customer.id,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
      response: {
        select: {
          id: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  });

  return reviews;
};

const getAllReviews = async (
  filters: IReviewFilters,
  options: IPaginationOptions
) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { rating } = filters;

  const whereConditions: Prisma.ReviewWhereInput = {};
  
  if (rating) {
    whereConditions.rating = Number(rating);
  }

  const reviews = await prisma.review.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          shop: {
            select: {
              id: true,
              name: true,
              vendor: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  const total = await prisma.review.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total
    },
    data: reviews
  };
};

export const ReviewService = {
  createReview,
  getProductReviews,
  getVendorProductReviews,
  getReviewByOrder,
  getAllReviews,
}; 