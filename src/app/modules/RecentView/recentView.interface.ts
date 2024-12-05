import { CustomerRecentProduct } from '@prisma/client';

export type IRecentViewCreate = {
  productId: string;
};

export type IRecentViewResponse = CustomerRecentProduct & {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    category: {
      id: string;
      name: string;
    };
  };
}; 