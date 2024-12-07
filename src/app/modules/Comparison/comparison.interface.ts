import { Product, Category, Shop } from '@prisma/client';

export type IComparisonCreate = {
  productId: string;
};

export type IComparisonResponse = {
  products: {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    image: string;
    isFlashSale: boolean;
    flashSalePrice: number | null;
    flashSaleStartTime?: Date | null;
    flashSaleEndTime?: Date | null;
    discount: number | null;
    averageRating: number;
    totalReviews: number;
    category: {
      id: string;
      name: string;
      description: string | null;
    };
    shop: {
      id: string;
      name: string;
      logo: string | null;
    };
  }[];
};
