export type IVendorFilterRequest = {
  searchTerm?: string | undefined;
  email?: string | undefined;
  contactNo?: string | undefined;
  // shopName?: string | undefined;
};

export type IVendorUpdate = {
  name: string;
  profilePhoto: string;
  contactNumber: string;
  address: string;

  // shopName: IShops[];
};

// export type IShops = {
//   shopId: string;
//   isDeleted?: null;
// };
