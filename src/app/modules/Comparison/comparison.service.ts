import prisma from '../../../shared/prisma';
import { IComparisonCreate, IComparisonResponse } from './comparison.interface';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';

const compareProducts = async (
  payload: IComparisonCreate
): Promise<IComparisonResponse> => {
  const { productIds } = payload;

  // Get all products with their details
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    include: {
      category: true,
      reviews: true,
    },
  });

  // Check if all products exist
  if (products.length !== productIds.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'One or more products not found');
  }

  // Check if all products are from the same category
  const categories = products.map(product => product.category.id);
  const uniqueCategories = new Set(categories);

  if (uniqueCategories.size > 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Can only compare products from the same category'
    );
  }

  // Calculate average ratings and prepare comparison details
  const comparisonDetails = products.map(product => {
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = product.reviews.length > 0 
      ? totalRating / product.reviews.length 
      : 0;

    return {
      name: product.name,
      price: product.price,
      category: product.category.name,
      description: product.description || '',
      stock: product.stock,
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews: product.reviews.length,
    };
  });

  return {
    products,
    comparisonDetails,
  };
};

export const ComparisonService = {
  compareProducts,
}; 