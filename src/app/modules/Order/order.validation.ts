import { z } from 'zod';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

const create = z.object({
  body: z.object({
    paymentMethod: z.enum([...Object.values(PaymentMethod)] as [string, ...string[]]).optional(),
  }).optional(),
});

const updateStatus = z.object({
  body: z.object({
    status: z.enum([...Object.values(OrderStatus)] as [string, ...string[]]),
  }),
});

const applyCoupon = z.object({
  body: z.object({
    code: z.string({
      required_error: 'Coupon code is required',
    }),
  }),
});

export const OrderValidation = {
  create,
  updateStatus,
  applyCoupon,
}; 