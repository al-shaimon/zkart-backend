import express from 'express';
import { NewsletterController } from './newsletter.controller';
import validateRequest from '../../middlewares/validateRequest';
import { NewsletterValidation } from './newsletter.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post(
  '/subscribe',
  validateRequest(NewsletterValidation.subscribe),
  NewsletterController.subscribe
);

router.get('/subscribers', auth(UserRole.ADMIN), NewsletterController.getAllSubscribers);

export const NewsletterRoutes = router;
