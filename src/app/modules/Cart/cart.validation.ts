import { z } from 'zod';

const addToCart = z.object({
  body: z.object({
    productId: z.string({
      required_error: 'Product ID is required',
    }),
    quantity: z
      .number({
        required_error: 'Quantity is required',
      })
      .min(1),
    replaceCart: z.boolean().optional(), // For handling different vendor products
  }),
});

const updateCartItem = z.object({
  body: z.object({
    quantity: z
      .number({
        required_error: 'Quantity is required',
      })
      .min(1),
  }),
});

export const CartValidation = {
  addToCart,
  updateCartItem,
};
