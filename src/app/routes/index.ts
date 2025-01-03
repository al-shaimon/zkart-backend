import express from 'express';
import { AuthRoutes } from '../modules/Auth/auth.routes';
import { AdminRoutes } from '../modules/Admin/admin.routes';
import { UserRoutes } from '../modules/User/user.routes';
import { VendorRoutes } from '../modules/Vendor/vendor.routes';
import { CustomerRoutes } from '../modules/Customer/customer.routes';
import { ProductRoutes } from '../modules/Product/product.routes';
import { CategoryRoutes } from '../modules/Category/category.routes';
import { ShopRoutes } from '../modules/Shop/shop.routes';
import { CartRoutes } from '../modules/Cart/cart.routes';
import { OrderRoutes } from '../modules/Order/order.routes';
import { CouponRoutes } from '../modules/Coupon/coupon.routes';
import { ReviewRoutes } from '../modules/Review/review.routes';
import { ComparisonRoutes } from '../modules/Comparison/comparison.routes';
import { RecentViewRoutes } from '../modules/RecentView/recentView.routes';
import { ShopFollowerRoutes } from '../modules/ShopFollower/shopFollower.routes';
import { ShopBlacklistRoutes } from '../modules/ShopBlacklist/shopBlacklist.routes';
import { ContactRoutes } from '../modules/Contact/contact.routes';
import { NewsletterRoutes } from '../modules/Newsletter/newsletter.routes';

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
  {
    path: '/vendor',
    route: VendorRoutes,
  },
  {
    path: '/customer',
    route: CustomerRoutes,
  },
  {
    path: '/product',
    route: ProductRoutes,
  },
  {
    path: '/category',
    route: CategoryRoutes,
  },
  {
    path: '/shop',
    route: ShopRoutes,
  },
  {
    path: '/cart',
    route: CartRoutes,
  },
  {
    path: '/order',
    route: OrderRoutes,
  },
  {
    path: '/coupon',
    route: CouponRoutes,
  },
  {
    path: '/review',
    route: ReviewRoutes,
  },
  {
    path: '/compare',
    route: ComparisonRoutes,
  },
  {
    path: '/recent-view',
    route: RecentViewRoutes,
  },
  {
    path: '/',
    route: ShopFollowerRoutes,
  },
  {
    path: '/',
    route: ShopBlacklistRoutes,
  },
  {
    path: '/contact',
    route: ContactRoutes,
  },
  {
    path: '/newsletter',
    route: NewsletterRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
