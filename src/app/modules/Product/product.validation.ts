import { z } from 'zod';

const createFlashSale = z.object({
  body: z
    .object({
      productId: z.string({
        required_error: 'Product ID is required',
      }),
      flashSalePrice: z
        .number({
          required_error: 'Flash sale price is required',
        })
        .positive('Flash sale price must be positive')
        .optional(),
      discount: z
        .number({
          required_error: 'Discount percentage is required',
        })
        .min(0)
        .max(100)
        .optional(),
      flashSaleEnds: z
        .string({
          required_error: 'Flash sale end date is required',
        })
        .refine((date) => new Date(date) > new Date(), {
          message: 'Flash sale end date must be in the future',
        }),
    })
    .refine(
      (data) => {
        // Check if exactly one of flashSalePrice or discount is provided
        return (
          (data.flashSalePrice === undefined) !== (data.discount === undefined)
        );
      },
      {
        message:
          'Please provide either flashSalePrice or discount percentage, not both',
      }
    ),
});

export const ProductValidation = {
  createFlashSale,
};
