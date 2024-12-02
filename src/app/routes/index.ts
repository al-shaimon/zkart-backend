import express from 'express';
import { AuthRoutes } from '../modules/Auth/auth.routes';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/',
    route: AuthRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
