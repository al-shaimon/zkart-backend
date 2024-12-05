import { Review } from '@prisma/client';

export type IReviewCreate = {
  productId: string;
  rating: number;
  comment: string;
  orderId: string;
};

export type IReviewFilters = {
  searchTerm?: string;
  productId?: string;
  rating?: number;
};

export type IReviewResponse = Review; 