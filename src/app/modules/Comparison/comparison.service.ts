import prisma from '../../../shared/prisma';
import { IComparisonCreate, IComparisonResponse } from './comparison.interface';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';

const getComparisonList = async (userEmail: string): Promise<IComparisonResponse> => {
  // Get customer
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  // Get comparison list with products
  const comparisons = await prisma.customerProductComparison.findMany({
    where: { customerId: customer.id },
    include: {
      product: {
        include: {
          category: true,
          shop: true,
          reviews: true,
        },
      },
    },
    orderBy: { addedAt: 'desc' },
  });

  // Transform and calculate data
  const products = comparisons.map((comparison) => {
    const product = comparison.product;
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating =
      product.reviews.length > 0 ? Number((totalRating / product.reviews.length).toFixed(1)) : 0;

    return {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      image: product.image || '',
      isFlashSale: product.isFlashSale,
      flashSalePrice: product.flashSalePrice,
      discount: product.discount,
      averageRating,
      totalReviews: product.reviews.length,
      category: {
        id: product.category.id,
        name: product.category.name,
        description: product.category.description,
      },
      shop: {
        id: product.shop.id,
        name: product.shop.name,
        logo: product.shop.logo,
      },
    };
  });

  return { products };
};

const addToCompare = async (payload: IComparisonCreate, userEmail: string): Promise<void> => {
  const { productId } = payload;

  // Get customer
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  // Get current comparison count
  const currentComparisons = await prisma.customerProductComparison.findMany({
    where: { customerId: customer.id },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  });

  // Check if already comparing 3 products
  if (currentComparisons.length >= 3) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot compare more than 3 products');
  }

  // Get the product to be added
  const newProduct = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });

  if (!newProduct) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  // Check if product is from same category
  if (currentComparisons.length > 0) {
    const categoryId = currentComparisons[0].product.category.id;
    if (categoryId !== newProduct.category.id) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Can only compare products from the same category'
      );
    }
  }

  // Add to comparison
  await prisma.customerProductComparison.create({
    data: {
      customerId: customer.id,
      productId: productId,
    },
  });
};

const removeFromCompare = async (productId: string, userEmail: string): Promise<void> => {
  // Get customer
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  // Remove from comparison
  await prisma.customerProductComparison.delete({
    where: {
      customerId_productId: {
        customerId: customer.id,
        productId: productId,
      },
    },
  });
};

export const ComparisonService = {
  getComparisonList,
  addToCompare,
  removeFromCompare,
};
