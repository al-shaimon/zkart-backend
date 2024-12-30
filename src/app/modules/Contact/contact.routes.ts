import express from 'express';
import { ContactController } from './contact.controller';
import validateRequest from '../../middlewares/validateRequest';
import { ContactValidation } from './contact.validation';

const router = express.Router();

router.post(
  '/submit',
  validateRequest(ContactValidation.create),
  ContactController.submitContactForm
);

export const ContactRoutes = router;
