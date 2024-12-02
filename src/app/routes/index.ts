import express from 'express';
import { AuthRoutes } from '../modules/Auth/auth.routes';
import { AdminRoutes } from '../modules/Admin/admin.routes';
import { UserRoutes } from '../modules/User/user.routes';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/admin',
    route: AdminRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
