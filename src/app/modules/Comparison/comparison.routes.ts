import express from 'express';
import { ComparisonController } from './comparison.controller';
import validateRequest from '../../middlewares/validateRequest';
import { ComparisonValidation } from './comparison.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Get comparison list
router.get('/', auth(UserRole.CUSTOMER), ComparisonController.getComparisonList);

// Add product to comparison
router.post(
  '/add',
  auth(UserRole.CUSTOMER),
  validateRequest(ComparisonValidation.addToCompare),
  ComparisonController.addToCompare
);

// Remove product from comparison
router.delete('/:productId', auth(UserRole.CUSTOMER), ComparisonController.removeFromCompare);

export const ComparisonRoutes = router;
