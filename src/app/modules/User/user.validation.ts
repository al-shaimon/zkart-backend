import { UserStatus } from '@prisma/client';
import { z } from 'zod';

const createAdmin = z.object({
  password: z.string({
    required_error: 'Password is required',
  }),
  admin: z.object({
    name: z.string({
      required_error: 'Name is required',
    }),
    email: z.string({
      required_error: 'Email is required',
    }),
    profilePhoto: z.string().optional(),
    contactNumber: z.string({
      required_error: 'Contact number is required',
    }),
  }),
});

const createVendor = z.object({
  password: z.string({
    required_error: 'Password is required',
  }),
  vendor: z.object({
    name: z.string({
      required_error: 'Name is required!',
    }),
    email: z.string({
      required_error: 'Email is required!',
    }),
    profilePhoto: z.string().optional(),
    contactNumber: z.string({
      required_error: 'Contact Number is required!',
    }),
    address: z.string().optional(),
  }),
});

const createCustomer = z.object({
  password: z.string(),
  customer: z.object({
    name: z.string({
      required_error: 'Name is required!',
    }),
    email: z.string({
      required_error: 'Email is required!',
    }),
    profilePhoto: z.string().optional(),
    contactNumber: z.string({
      required_error: 'Contact Number is required!',
    }),
    address: z.string().optional(),
  }),
});

const updateStatus = z.object({
  body: z.object({
    status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED, UserStatus.DELETED]),
  }),
});

export const userValidation = {
  createAdmin,
  createVendor,
  createCustomer,
  updateStatus,
};
