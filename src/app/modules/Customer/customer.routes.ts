import express from 'express';
import { CustomerController } from './customer.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.get('/', CustomerController.getAllFromDB);

router.get('/:id', CustomerController.getByIdFromDB);

router.patch('/:id', CustomerController.updateIntoDB);

router.delete('/:id', auth(UserRole.ADMIN), CustomerController.deleteFromDB);

router.delete('/soft/:id', auth(UserRole.ADMIN), CustomerController.softDelete);

export const CustomerRoutes = router;
