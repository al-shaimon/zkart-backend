import { ShopFollower } from '@prisma/client';

export type IShopFollowerResponse = ShopFollower & {
  shop: {
    id: string;
    name: string;
    logo: string | null;
    description: string | null;
  };
};

export type IShopFollowerWithCustomer = {
  id: string;
  createdAt: Date;
  customer: {
    id: string;
    name: string;
    email: string;
    profilePhoto: string | null;
  };
};

export type IShopFollowersResponse = {
  followers: IShopFollowerWithCustomer[];
  totalFollowers: number;
}; 