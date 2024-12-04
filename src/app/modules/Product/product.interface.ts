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
