import { z } from 'zod';

const create = z.object({
  name: z.string({
    required_error: 'Shop name is required'
  }),
  description: z.string().optional(),
  logo: z.string().optional()
});

const update = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional()
});

export const ShopValidation = {
  create,
  update
}; 