import { z } from 'zod';

const create = z.object({
  body: z.object({
    productId: z.string({
      required_error: 'Product ID is required',
    }),
    rating: z.number({
      required_error: 'Rating is required',
    }).min(1).max(5),
    comment: z.string({
      required_error: 'Comment is required',
    }).min(10).max(500),
    orderId: z.string({
      required_error: 'Order ID is required',
    }),
  }),
});

export const ReviewValidation = {
  create,
}; 