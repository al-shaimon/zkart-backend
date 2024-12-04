import { Coupon } from '@prisma/client';

export type ICouponCreate = {
  code: string;
  discount: number;
  validFrom?: Date;
  validUntil?: Date;
  usageLimit?: number;
  shopId: string;
};

export type ICouponFilters = {
  searchTerm?: string;
  code?: string;
  isActive?: boolean;
};

export type ICouponResponse = Coupon; 