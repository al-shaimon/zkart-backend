import { z } from 'zod';

const create = z.object({
  body: z.object({
    shopId: z.string({
      required_error: 'Shop ID is required',
    }),
    reason: z.string({
      required_error: 'Reason is required',
    }),
  }),
});

export const ShopBlacklistValidation = {
  create,
}; 