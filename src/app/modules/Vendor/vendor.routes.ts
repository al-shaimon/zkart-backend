import express from 'express';
import { VendorController } from './vendor.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.get('/', VendorController.getAllFromDB);

router.get('/:id', VendorController.getByIdFromDB);

router.patch('/:id', auth(UserRole.VENDOR), VendorController.updateIntoDB);

router.delete('/:id', auth(UserRole.ADMIN), VendorController.deleteFromDB);

router.delete('/soft/:id', auth(UserRole.ADMIN), VendorController.softDelete);

export const VendorRoutes = router;
