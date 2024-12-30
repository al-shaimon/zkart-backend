import nodemailer from 'nodemailer';
import config from '../../../config';

const emailSender = async (to: string, html: string, subject: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: config.emailSender.email,
      pass: config.emailSender.app_pass,
    },
  });

  await transporter.sendMail({
    from: '"ZKart - " <alshaimon152@gmail.com>',
    to,
    subject,
    html,
  });
};

export default emailSender;
