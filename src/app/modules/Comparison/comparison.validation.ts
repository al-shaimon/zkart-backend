import { z } from 'zod';

const addToCompare = z.object({
  body: z.object({
    productId: z.string({
      required_error: 'Product ID is required',
    }),
  }),
});

export const ComparisonValidation = {
  addToCompare,
};
