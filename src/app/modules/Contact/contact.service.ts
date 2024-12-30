import { ContactForm } from '@prisma/client';
import prisma from '../../../shared/prisma';
import { IContactFormData } from './contact.interface';
import emailSender from '../Auth/emailSender';

const submitContactForm = async (payload: IContactFormData): Promise<ContactForm> => {
  // Save to database
  const result = await prisma.contactForm.create({
    data: payload,
  });

  // Send email
  await emailSender(
    'alshaimon152@gmail.com',
    `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Contact Form Submission</h2>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        <p><strong>Name:</strong> ${payload.name}</p>
        <p><strong>Email:</strong> ${payload.email}</p>
        <p><strong>Subject:</strong> ${payload.subject}</p>
        <p><strong>Message:</strong></p>
        <p style="background-color: white; padding: 10px; border-radius: 3px;">${payload.message}</p>
      </div>
    </div>
    `,
    'New Contact Form Submission'
  );

  return result;
};

export const ContactService = {
  submitContactForm,
};
