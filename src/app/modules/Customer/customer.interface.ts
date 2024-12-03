export type ICustomerFilterRequest = {
  searchTerm?: string | undefined;
  email?: string | undefined;
  contactNumber?: string | undefined;
};

export type ICustomerUpdate = {
  name: string;
  contactNumber: string;
  address: string;
};
