import express from 'express';
import { RecentViewController } from './recentView.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.get('/', auth(UserRole.CUSTOMER), RecentViewController.getRecentViews);

router.post('/', auth(UserRole.CUSTOMER), RecentViewController.addRecentView);

export const RecentViewRoutes = router;
