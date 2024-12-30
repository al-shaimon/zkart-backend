import { NewsletterSubscriber } from '@prisma/client';
import prisma from '../../../shared/prisma';
import { INewsletterSubscribe } from './newsletter.interface';
import emailSender from '../Auth/emailSender';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';

const subscribe = async (payload: INewsletterSubscribe): Promise<NewsletterSubscriber> => {
  // Check if already subscribed
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: payload.email },
  });

  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already subscribed to newsletter');
  }

  // Save to database
  const result = await prisma.newsletterSubscriber.create({
    data: payload,
  });

  // Send confirmation email
  await emailSender(
    payload.email,
    `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to Our Newsletter! 🎉</h2>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
        <p>Thank you for subscribing to our newsletter! We're excited to have you join our community.</p>
        <p>You'll now receive updates about:</p>
        <ul style="list-style-type: none; padding-left: 0;">
          <li>✨ New products and services</li>
          <li>🎁 Exclusive offers and promotions</li>
          <li>📰 Latest news and updates</li>
        </ul>
        <p style="margin-top: 20px;">Stay tuned for our next update!</p>
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">If you didn't subscribe to our newsletter, please ignore this email.</p>
    </div>
    `,
    'Welcome to Our Newsletter! 🎉'
  );

  return result;
};

const getAllSubscribers = async () => {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = await prisma.newsletterSubscriber.count();

  return {
    meta: {
      page: 1,
      limit: 100,
      total,
    },
    data: subscribers,
  };
};

export const NewsletterService = {
  subscribe,
  getAllSubscribers,
};
