import { ShopBlacklist } from '@prisma/client';

export type IShopBlacklistCreate = {
  shopId: string;
  reason: string;
};

export type IShopBlacklistResponse = ShopBlacklist & {
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