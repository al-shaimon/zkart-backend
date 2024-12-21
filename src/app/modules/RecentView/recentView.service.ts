import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';
import { IRecentViewCreate } from './recentView.interface';

const addRecentView = async (
  productId: string,
  userEmail: string
): Promise<void> => {
  // Find customer
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  // Get count of recent views for this customer
  const viewCount = await prisma.customerRecentProduct.count({
    where: { customerId: customer.id },
  });

  // If already at 10 views, delete the oldest one
  if (viewCount >= 10) {
    const oldestView = await prisma.customerRecentProduct.findFirst({
      where: { customerId: customer.id },
      orderBy: { viewedAt: 'asc' },
    });

    if (oldestView) {
      await prisma.customerRecentProduct.delete({
        where: { id: oldestView.id },
      });
    }
  }

  // Add new view or update existing one
  await prisma.customerRecentProduct.upsert({
    where: {
      customerId_productId: {
        customerId: customer.id,
        productId: productId,
      },
    },
    create: {
      customerId: customer.id,
      productId: productId,
      viewedAt: new Date(),
    },
    update: {
      viewedAt: new Date(),
    },
  });
};

const getRecentViews = async (userEmail: string) => {
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const recentViews = await prisma.customerRecentProduct.findMany({
    where: { customerId: customer.id },
    orderBy: { viewedAt: 'desc' },
    take: 10,
    include: {
      product: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          shop: {
            select: {
              id: true,
              name: true,
              logo: true,
              description: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              customerId: true,
              createdAt: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return recentViews;
};

export const RecentViewService = {
  addRecentView,
  getRecentViews,
}; 