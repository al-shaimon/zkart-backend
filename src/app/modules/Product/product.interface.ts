export type IProductFilters = {
  searchTerm?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  isFlashSale?: boolean;
  shopId?: string;
};

export type IProductCreate = {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  shopId: string;
};

export type IProductUpdate = {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
};

export interface IFlashSaleProduct {
  id: string;
  name: string;
  price: number;
  discountedPrice: number;
  discountPercentage: number;
  flashSaleStartTime: Date;
  flashSaleEndTime: Date;
  stock: number;
  image: string;
  shop: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
}

export type IFlashSaleCreate = {
  productId: string;
  flashSalePrice?: number;
  discount?: number;
  flashSaleEnds: Date;
};
