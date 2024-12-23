import { Cart, CartItem, Prisma } from '@prisma/client';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';
import { ICartItemCreate, ICartItemUpdate, ICartResponse } from './cart.interface';
import config from '../../../config';

const addToCart = async (
  payload: ICartItemCreate & { replaceCart?: boolean },
  userEmail: string
): Promise<ICartResponse> => {
  // Get customer info
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail, isDeleted: false },
    include: { cart: true },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  // Get product info
  const product = await prisma.product.findUnique({
    where: { id: payload.productId, isDeleted: false },
    include: { shop: true },
  });

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  if (product.stock < payload.quantity) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Product out of stock');
  }

  // Check existing cart
  if (customer.cart && customer.cart.shopId !== product.shopId && !payload.replaceCart) {
    const errorMessage = JSON.stringify({
      message:
        'Cannot add products from different shops. Would you like to replace your current cart?',
      error: 'DIFFERENT_SHOP',
      currentShopId: customer.cart.shopId,
      newShopId: product.shopId,
      requiresConfirmation: true,
    });

    throw new ApiError(httpStatus.CONFLICT, errorMessage);
  }

  const result = await prisma.$transaction(async (tx) => {
    // If customer has a cart and we're replacing it or adding from different shop
    if (customer.cart && (payload.replaceCart || customer.cart.shopId !== product.shopId)) {
      // Delete existing cart items and cart
      await tx.cartItem.deleteMany({
        where: { cartId: customer.cart.id },
      });
      await tx.cart.delete({
        where: { id: customer.cart.id },
      });
    }

    // Create new cart if customer doesn't have one
    if (!customer.cart || payload.replaceCart || customer.cart.shopId !== product.shopId) {
      const newCart = await tx.cart.create({
        data: {
          customerId: customer.id,
          shopId: product.shopId,
          items: {
            create: {
              productId: payload.productId,
              quantity: payload.quantity,
            },
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  image: true,
                  stock: true,
                },
              },
            },
          },
          coupon: true
        },
      });

      return {
        ...newCart,
        totalAmount: calculateTotalAmount(newCart.items),
      };
    }

    // Add to existing cart
    const existingItem = await tx.cartItem.findFirst({
      where: {
        cartId: customer.cart.id,
        productId: payload.productId,
      },
    });

    if (existingItem) {
      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + payload.quantity },
      });
    } else {
      await tx.cartItem.create({
        data: {
          cartId: customer.cart.id,
          productId: payload.productId,
          quantity: payload.quantity,
        },
      });
    }

    const updatedCart = await tx.cart.findUnique({
      where: { id: customer.cart.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
                stock: true,
              },
            },
          },
        },
        coupon: {
          select: {
            code: true,
            discount: true,
            usageLimit: true,
          },
        },
      },
    });

    if (!updatedCart) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found after update');
    }

    return {
      ...updatedCart,
      totalAmount: calculateTotalAmount(updatedCart.items),
      coupon: updatedCart.coupon ? {
        ...updatedCart.coupon,
        discountType: 'FLAT',
        discountMessage: `${updatedCart.coupon.discount}% off on your order`
      } : null
    };
  });

  const totalAmount = result.items.reduce((total, item) => {
    return total + (item.quantity * item.product.price);
  }, 0);

  const finalAmount = totalAmount - (result.discount || 0);

  let discountType: 'FLAT' | 'UPTO' = 'FLAT';
  let discountMessage = '';

  if (result.coupon) {
    const calculatedDiscount = (totalAmount * result.coupon.discount) / 100;
    if (result.coupon.usageLimit && calculatedDiscount > result.coupon.usageLimit) {
      discountType = 'UPTO';
      discountMessage = `${result.coupon.discount}% off (up to ${result.coupon.usageLimit} ${config.currency})`;
    } else {
      discountMessage = `${result.coupon.discount}% off on your order`;
    }
  }

  return {
    ...result,
    totalAmount,
    discount: result.discount || 0,
    finalAmount,
    coupon: result.coupon ? {
      ...result.coupon,
      discountType,
      discountMessage
    } : null,
  };
};

const getCart = async (userEmail: string): Promise<ICartResponse> => {
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail, isDeleted: false },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const cart = await prisma.cart.findFirst({
    where: { customerId: customer.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              stock: true,
            },
          },
        },
      },
      coupon: {
        select: {
          code: true,
          discount: true,
          usageLimit: true,
        },
      },
    },
  });

  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found');
  }

  const cartTotal = cart.items.reduce((total, item) => {
    return total + (item.quantity * item.product.price);
  }, 0);

  let discountType: 'FLAT' | 'UPTO' = 'FLAT';
  let discountMessage = '';

  if (cart.coupon) {
    const calculatedDiscount = (cartTotal * cart.coupon.discount) / 100;
    if (cart.coupon.usageLimit && calculatedDiscount > cart.coupon.usageLimit) {
      discountType = 'UPTO';
      discountMessage = `${cart.coupon.discount}% off (up to ${cart.coupon.usageLimit} ${config.currency})`;
    } else {
      discountMessage = `${cart.coupon.discount}% off on your order`;
    }
  }

  const finalAmount = cartTotal - (cart.discount || 0);

  return {
    id: cart.id,
    customerId: cart.customerId,
    shopId: cart.shopId,
    isDeleted: cart.isDeleted,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    items: cart.items,
    totalAmount: cartTotal,
    discount: cart.discount || 0,
    finalAmount,
    coupon: cart.coupon ? {
      ...cart.coupon,
      discountType,
      discountMessage
    } : null,
  };
};

const updateCartItem = async (
  id: string,
  payload: Partial<ICartItemCreate>,
  userEmail: string
): Promise<ICartResponse> => {
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail, isDeleted: false },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: id },
    include: {
      cart: true,
      product: true,
    },
  });

  if (!cartItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cart item not found');
  }

  if (cartItem.cart.customerId !== customer.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }

  if (payload.quantity === undefined) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Quantity is required');
  }

  if (cartItem.product.stock < payload.quantity) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Requested quantity not available');
  }

  await prisma.cartItem.update({
    where: { id: id },
    data: { quantity: payload.quantity },
  });

  const result = await prisma.cart.findFirst({
    where: { id: cartItem.cartId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              stock: true,
            },
          },
        },
      },
      coupon: {
        select: {
          code: true,
          discount: true,
          usageLimit: true,
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found after update');
  }

  const totalAmount = result.items.reduce((total, item) => {
    return total + (item.quantity * item.product.price);
  }, 0);

  const finalAmount = totalAmount - (result.discount || 0);

  let discountType: 'FLAT' | 'UPTO' = 'FLAT';
  let discountMessage = '';

  if (result.coupon) {
    const calculatedDiscount = (totalAmount * result.coupon.discount) / 100;
    if (result.coupon.usageLimit && calculatedDiscount > result.coupon.usageLimit) {
      discountType = 'UPTO';
      discountMessage = `${result.coupon.discount}% off (up to ${result.coupon.usageLimit} ${config.currency})`;
    } else {
      discountMessage = `${result.coupon.discount}% off on your order`;
    }
  }

  return {
    ...result,
    totalAmount,
    discount: result.discount || 0,
    finalAmount,
    coupon: result.coupon ? {
      ...result.coupon,
      discountType,
      discountMessage
    } : null,
  };
};

const removeCartItem = async (itemId: string, userEmail: string): Promise<ICartResponse> => {
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail, isDeleted: false },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });

  if (!cartItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cart item not found');
  }

  if (cartItem.cart.customerId !== customer.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }

  await prisma.cartItem.delete({
    where: { id: itemId },
  });

  const updatedCart = await getCart(userEmail);
  if (!updatedCart?.items.length) {
    await prisma.cart.delete({
      where: { id: cartItem.cartId },
    });
    return {
      id: cartItem.cartId,
      customerId: customer.id,
      shopId: cartItem.cart.shopId,
      items: [],
      totalAmount: 0,
      isDeleted: false,
      createdAt: cartItem.cart.createdAt,
      updatedAt: cartItem.cart.updatedAt,
      discount: 0,
      finalAmount: 0
    };
  }

  return updatedCart;
};

const clearCart = async (userEmail: string): Promise<void> => {
  const customer = await prisma.customer.findUnique({
    where: { email: userEmail, isDeleted: false },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const cart = await prisma.cart.findFirst({
    where: { customerId: customer.id },
  });

  if (cart) {
    await prisma.$transaction([
      prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      }),
      prisma.cart.delete({
        where: { id: cart.id },
      }),
    ]);
  }
};

// Helper function to calculate total amount
const calculateTotalAmount = (items: any[]): number => {
  return items.reduce((total, item) => {
    return total + item.product.price * item.quantity;
  }, 0);
};

export const CartService = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
