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

export type IReviewByOrderResponse = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    image: string;
  };
  customer: {
    id: string;
    name: string;
  };
  response?: {
    id: string;
    comment: string;
    createdAt: Date;
  } | null;
};

export type IAdminReviewResponse = {
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  data: {
    id: string;
    rating: number;
    comment: string;
    createdAt: Date;
    customer: {
      id: string;
      name: string;
      email: string;
    };
    product: {
      id: string;
      name: string;
      price: number;
      shop: {
        id: string;
        name: string;
        vendor: {
          id: string;
          name: string;
          email: string;
        };
      };
    };
  }[];
};