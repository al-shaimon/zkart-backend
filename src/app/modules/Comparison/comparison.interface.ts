import { Product } from '@prisma/client';

export type IComparisonCreate = {
  productIds: string[];
};

export type IComparisonResponse = {
  products: Product[];
  comparisonDetails: {
    name: string;
    price: number;
    category: string;
    description: string;
    stock: number;
    averageRating: number;
    totalReviews: number;
  }[];
}; 