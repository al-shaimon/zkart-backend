import { Shop } from '@prisma/client';

export interface IShopResponse extends Shop {
  shop: {
    id: string;
    name: string;
    logo: string | null;
    description: string | null;
  };
}


export type IShopCreate = {
  name: string;
  description?: string;
  logo?: string;
  vendorId: string;
};

export type IShopFilters = {
  searchTerm?: string;
  vendorId?: string;
};

export type IShopUpdate = Partial<Omit<IShopCreate, 'vendorId'>>; 