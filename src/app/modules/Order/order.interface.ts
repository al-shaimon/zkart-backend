import { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export type IOrderItemCreate = {
  productId: string;
  quantity: number;
  price: number;
};

export type IOrderCreate = {
  paymentMethod?: PaymentMethod;
  couponCode?: string;
};

export type IOrderFilters = {
  searchTerm?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
};

export type IOrderResponse = {
  id: string;
  customerId: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentId: string | null;
  discount: number;
  couponId: string | null;
  coupon: {
    id: string;
    code: string;
    discount: number;
  } | null;
  orderItems: {
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      image: string;
    };
  }[];
  customer: {
    id: string;
    name: string;
    email: string;
    contactNumber: string;
    address: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
};

export interface IOrderWithPayment {
  order: IOrderResponse;
  clientSecret: string | null;
}

export type ICouponApply = {
  code: string;
};

export interface IOrderClientResponse {
  id: string;
  totalAmount: number;
  clientSecret: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}

export interface ICouponApplyResponse {
  originalAmount: number;
  discount: number;
  finalAmount: number;
  coupon: {
    code: string;
    discount: number;
  };
}
