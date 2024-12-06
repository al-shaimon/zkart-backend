import { Prisma, Product } from '@prisma/client';
import prisma from '../../../shared/prisma';
import {
  IProductCreate,
  IProductFilters,
  IProductUpdate,
  IFlashSaleCreate,
} from './product.interface';
import { IPaginationOptions } from '../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import ApiError from '../../errors/ApiError';
import { Request } from 'express';
import { fileUploader } from '../../../helpers/fileUploader';
import httpStatus from 'http-status';

const createProduct = async (req: Request, userEmail: string): Promise<Product> => {
  // First, get the vendor information using the email
  const vendor = await prisma.vendor.findUnique({
    where: {
      email: userEmail,
      isDeleted: false,
    },
  });

  if (!vendor) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Vendor information not found');
  }

  // Get vendor's shop
  const shop = await prisma.shop.findFirst({
    where: {
      vendorId: vendor.id,
      isDeleted: false,
    },
  });

  if (!shop) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Vendor must have a shop to create products');
  }

  // Handle multiple file uploads
  const files = req.files as Express.Multer.File[];
  let imageUrls: string[] = [];

  if (files && files.length > 0) {
    const uploadPromises = files.map((file) => fileUploader.uploadToCloudinary(file));
    const uploadedImages = await Promise.all(uploadPromises);
    imageUrls = uploadedImages.map((img) => img?.secure_url).filter((url) => url) as string[];
  }

  // Create product with images
  const result = await prisma.$transaction(async (tx) => {
    // Create the product
    const product = await tx.product.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        price: parseFloat(req.body.price),
        stock: parseInt(req.body.stock),
        categoryId: req.body.categoryId,
        shopId: shop.id,
        isDeleted: false,
        image: imageUrls[0] || '', // Add the first image as the main product image
        images: {
          create: imageUrls.map((url) => ({
            url,
          })),
        },
      },
      include: {
        category: true,
        shop: true,
        images: true,
      },
    });

    return product;
  });

  if (!result) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create product');
  }

  return result;
};

const getAllProducts = async (filters: IProductFilters, options: IPaginationOptions) => {
  const { searchTerm, minPrice, maxPrice, ...filterData } = filters;
  const { limit, page, skip } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.ProductWhereInput[] = [
    {
      isDeleted: false,
    },
  ];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (minPrice !== undefined) {
    andConditions.push({ price: { gte: minPrice } });
  }

  if (maxPrice !== undefined) {
    andConditions.push({ price: { lte: maxPrice } });
  }

  const whereConditions: Prisma.ProductWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.product.findMany({
    where: whereConditions,
    skip,
    take: limit,
    include: {
      category: true,
      shop: true,
      images: true,
      reviews: {
        include: {
          customer: true,
          response: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = await prisma.product.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getProductById = async (id: string) => {
  const result = await prisma.product.findUnique({
    where: { id, isDeleted: false },
    include: {
      category: true,
      shop: true,
      images: true,
      reviews: {
        include: {
          customer: true,
          response: true,
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  return result;
};

const updateProduct = async (
  req: Request,
  productId: string,
  userEmail: string
): Promise<Product> => {
  // Verify vendor owns the product
  const vendor = await prisma.vendor.findUnique({
    where: {
      email: userEmail,
      isDeleted: false,
    },
  });

  if (!vendor) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Vendor information not found');
  }

  const existingProduct = await prisma.product.findFirst({
    where: {
      id: productId,
      shop: {
        vendorId: vendor.id,
      },
      isDeleted: false,
    },
    include: {
      images: true,
    },
  });

  if (!existingProduct) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Product not found or you do not have permission to update it'
    );
  }

  // Handle file uploads
  const files = req.files as Express.Multer.File[];
  let newImageUrls: string[] = [];

  if (files && files.length > 0) {
    const uploadPromises = files.map((file) => fileUploader.uploadToCloudinary(file));
    const uploadedImages = await Promise.all(uploadPromises);
    newImageUrls = uploadedImages.map((img) => img?.secure_url).filter((url) => url) as string[];
  }

  // Update product and images
  const result = await prisma.$transaction(async (tx) => {
    // Update product details
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        name: req.body.name || existingProduct.name,
        description: req.body.description || existingProduct.description,
        price: req.body.price ? parseFloat(req.body.price) : existingProduct.price,
        stock: req.body.stock ? parseInt(req.body.stock) : existingProduct.stock,
        categoryId: req.body.categoryId || existingProduct.categoryId,
        image: newImageUrls[0] || existingProduct.image,
      },
    });

    // Replace existing images with new ones
    if (newImageUrls.length > 0) {
      // Delete existing images
      await tx.productImage.deleteMany({
        where: { productId },
      });

      // Add new images without order field
      await tx.productImage.createMany({
        data: newImageUrls.map((url) => ({
          url,
          productId,
        })),
      });
    }

    // Return updated product with all relations
    return await tx.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        shop: true,
        images: true,
      },
    });
  });

  if (!result) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update product');
  }

  return result;
};

const deleteProduct = async (id: string, vendorId: string): Promise<Product> => {
  // Verify product belongs to vendor
  const product = await prisma.product.findFirst({
    where: {
      id,
      shop: {
        vendorId,
      },
    },
  });

  if (!product) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete your own products');
  }

  const result = await prisma.product.update({
    where: { id },
    data: { isDeleted: true },
  });

  return result;
};

const duplicateProduct = async (id: string, vendorId: string): Promise<Product> => {
  const product = await prisma.product.findFirst({
    where: {
      id,
      shop: {
        vendorId,
      },
    },
  });

  if (!product) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only duplicate your own products');
  }

  const { id: _, createdAt, updatedAt, ...productData } = product;

  const result = await prisma.product.create({
    data: {
      ...productData,
      name: `${productData.name} (Copy)`,
    },
    include: {
      category: true,
      shop: true,
    },
  });

  return result;
};

const getFlashSaleProducts = async (options: IPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);

  const currentDate = new Date();

  const whereConditions: Prisma.ProductWhereInput = {
    isDeleted: false,
    isFlashSale: true,
    flashSaleEnds: {
      gte: currentDate, // Sale hasn't ended
    },
    stock: {
      gt: 0, // Only show products with stock
    },
    shop: {
      isDeleted: false,
      ShopBlacklist: null, // Exclude products from blacklisted shops
    },
  };

  const result = await prisma.product.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: [
      {
        discount: 'desc', // Higher discounts first
      },
      {
        flashSaleEnds: 'asc', // Ending sooner appears first
      },
    ],
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      flashSalePrice: true,
      discount: true,
      flashSaleEnds: true,
      stock: true,
      image: true,
      images: {
        where: {
          isMain: true,
        },
        take: 1,
      },
      shop: {
        select: {
          id: true,
          name: true,
          logo: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      reviews: {
        include: {
          customer: true,
          response: true,
        },
      },
    },
  });

  const total = await prisma.product.count({
    where: whereConditions,
  });

  // Transform the data to include calculated fields
  const transformedData = result.map((product) => ({
    ...product,
    discountPercentage: product.discount || 0,
    discountedPrice: product.flashSalePrice || product.price,
    mainImage: product.images[0]?.url || product.image,
  }));

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: transformedData,
  };
};

const createFlashSale = async (payload: IFlashSaleCreate, userEmail: string): Promise<Product> => {
  const { productId, flashSalePrice, discount, flashSaleEnds } = payload;

  // Find vendor
  const vendor = await prisma.vendor.findUnique({
    where: {
      email: userEmail,
      isDeleted: false,
    },
  });

  if (!vendor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor not found');
  }

  // Check if product exists and belongs to vendor's shop
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isDeleted: false,
      shop: {
        vendorId: vendor.id,
      },
    },
  });

  if (!product) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Product not found or you do not have permission to update it'
    );
  }

  let calculatedFlashSalePrice: number;
  let calculatedDiscount: number;

  // Calculate based on which value was provided
  if (flashSalePrice !== undefined) {
    // Validate flash sale price
    if (flashSalePrice >= product.price) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Flash sale price must be less than regular price'
      );
    }
    calculatedFlashSalePrice = flashSalePrice;
    // Calculate discount percentage
    calculatedDiscount = Number(
      (((product.price - flashSalePrice) / product.price) * 100).toFixed(2)
    );
  } else if (discount !== undefined) {
    // Calculate flash sale price from discount
    calculatedDiscount = discount;
    calculatedFlashSalePrice = Number(
      (product.price - (product.price * discount) / 100).toFixed(2)
    );
  } else {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Either flash sale price or discount must be provided'
    );
  }

  // Validate flash sale end date
  const currentDate = new Date();
  const endDate = new Date(flashSaleEnds);

  if (endDate <= currentDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Flash sale end date must be in the future');
  }

  // Update product with flash sale details
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      isFlashSale: true,
      flashSalePrice: calculatedFlashSalePrice,
      discount: calculatedDiscount,
      flashSaleEnds: endDate,
    },
    include: {
      category: true,
      shop: true,
      images: true,
    },
  });

  return updatedProduct;
};

export const ProductService = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  getFlashSaleProducts,
  createFlashSale,
};
