import { z } from 'zod';

const compare = z.object({
  body: z.object({
    productIds: z.array(z.string())
      .min(2, 'At least 2 products are required for comparison')
      .max(3, 'Maximum 3 products can be compared at once'),
  }),
});

export const ComparisonValidation = {
  compare,
}; 