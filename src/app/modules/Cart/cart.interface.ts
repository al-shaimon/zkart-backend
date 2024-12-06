export type ICartFilters = {
  customerId?: string;
};

export type ICartItemCreate = {
  productId: string;
  quantity: number;
};

export type ICartItemUpdate = {
  quantity: number;
};

export type ICartResponse = {
  id: string;
  customerId: string;
  shopId: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      price: number;
      image: string;
      stock: number;
    };
  }[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  coupon?: {
    code: string;
    discount: number;
    usageLimit?: number | null;
    discountType: 'FLAT' | 'UPTO';
    discountMessage: string;
  } | null;
}; 