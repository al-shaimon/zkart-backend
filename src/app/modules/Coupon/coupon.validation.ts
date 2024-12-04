import { z } from 'zod';

const create = z.object({
  body: z.object({
    code: z.string({
      required_error: 'Coupon code is required',
    }),
    discount: z.number({
      required_error: 'Discount percentage is required',
    }).min(0).max(100),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    usageLimit: z.number().int().positive().optional(),
  }),
});

const update = z.object({
  body: z.object({
    code: z.string().optional(),
    discount: z.number().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    usageLimit: z.number().int().positive().optional(),
  }),
});

export const CouponValidation = {
  create,
  update,
}; 