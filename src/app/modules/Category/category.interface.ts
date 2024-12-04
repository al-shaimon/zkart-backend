export type ICategoryCreate = {
  name: string;
  description?: string;
  image?: string;
};

export type ICategoryFilters = {
  searchTerm?: string;
};

export type ICategoryUpdate = Partial<ICategoryCreate>; 