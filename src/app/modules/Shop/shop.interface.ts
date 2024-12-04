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