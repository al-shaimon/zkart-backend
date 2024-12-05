import express from 'express';
import { ComparisonController } from './comparison.controller';
import validateRequest from '../../middlewares/validateRequest';
import { ComparisonValidation } from './comparison.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(ComparisonValidation.compare),
  ComparisonController.compareProducts
);

export const ComparisonRoutes = router;
