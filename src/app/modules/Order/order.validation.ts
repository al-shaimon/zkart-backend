import { z } from 'zod';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

const create = z.object({
  body: z.object({
    paymentMethod: z.enum([...Object.values(PaymentMethod)] as [string, ...string[]], {
      required_error: 'Payment method is required',
    }),
    couponId: z.string().optional(),
  }),
});

const updateStatus = z.object({
  body: z.object({
    status: z.enum([...Object.values(OrderStatus)] as [string, ...string[]]),
  }),
});

export const OrderValidation = {
  create,
  updateStatus,
}; 