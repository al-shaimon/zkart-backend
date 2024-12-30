import { z } from 'zod';

const subscribe = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email(),
  }),
});

export const NewsletterValidation = {
  subscribe,
};
