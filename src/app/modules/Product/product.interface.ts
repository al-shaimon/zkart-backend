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
  price: number;
  stock: number;
  categoryId: string;
  shopId: string;
  description?: string;
  discount?: number;
  image: string;
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleEnds?: Date;
};

export type IProductUpdate = Partial<IProductCreate>;
