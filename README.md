# ZKart - Your Ultimate Shopping Destination

A comprehensive e-commerce platform built with Next.js and TypeScript, offering seamless shopping
experiences for customers, vendors, and administrators.

## 🌐 Live URLs

- **Frontend:** [https://zkart.vercel.app](https://zkart.vercel.app)
- **Backend:** [https://zkart.alshaimon.com/api/v1](https://zkart.alshaimon.com/api/v1)

## 🛠️ Technology Stack

### Frontend

- Next.js 15.0.3 with TypeScript
- Redux Toolkit for state management
- Tailwind CSS for styling
- Shadcn UI components
- React Hook Form with Zod validation
- Stripe integration for payments
- JWT for authentication
- Lucide React for icons
- Date-fns for date formatting
- Sonner for toast notifications

### Backend

- Node.js with Express
- PostgreSQL with Prisma
- JWT authentication
- Cloudinary for image storage
- Stripe API integration

## ✨ Key Features

### For Customers

- Browse products with infinite scrolling
- Advanced filtering and search capabilities
- Shopping cart with single vendor restriction
- Secure checkout with Stripe integration
- Product comparison (up to 3 items)
- Review and rating system
- Order history tracking
- Shop following system
- Recently viewed products tracking
- Coupon code application

### For Vendors

- Shop management dashboard
- Product management (CRUD operations)
- Order processing and tracking
- Flash sale management
- Review monitoring
- Inventory management
- Sales analytics

### For Administrators

- User management system
- Shop monitoring and blacklisting
- Category management
- Transaction monitoring
- Review moderation
- Platform analytics

## 🚀 Setup Instructions

1. Clone the repository:

```bash
# Frontend
git clone https://github.com/al-shaimon/zkart-frontend.git

# Backend
git clone https://github.com/al-shaimon/zkart-backend.git

```

2. Install dependencies:

```bash
yarn install
```

3. Set up environment variables: Create a `.env.local` file with:

```env
NEXT_PUBLIC_API_URL=your_api_url
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

4. Set up environment variables: Create a `.env` file in Backend Code with:

```env
NODE_ENV="development"
PORT=5000

DATABASE_URL=postgresql_database_url

JWT_SECRET=jwt_secret
EXPIRES_IN=jwt_expires_in

REFRESH_TOKEN_SECRET=refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=refresh_token_expires

RESET_PASS_TOKEN=reset_pass_token
RESET_PASS_TOKEN_EXPIRES_IN=reset_password_token_expires_in
RESET_PASS_LINK=your_reset_password_link

EMAIL=your_gmail
APP_PASS=your_gmail_app_pass

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

CURRENCY=your_currency
```

5. Run the development server:

```bash
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 Core Functionalities

### Authentication System

- JWT-based authentication
- Role-based access control (Admin/Vendor/Customer)
- Password reset functionality
- Protected routes

### Shopping Experience

- Real-time cart updates
- Multi-image product views
- Dynamic pricing with discounts
- Flash sale system
- Responsive design for all devices

### Vendor Management

- Product inventory control
- Order fulfillment system
- Shop analytics
- Customer review management

## 🐛 Known Issues

1. Image upload preview sometimes shows cached images
2. Product comparison modal may lag with large product images

## 🔄 API Integration

The application integrates with several endpoints:

- Authentication: `/api/v1/auth`
- Products: `/api/v1/products`
- Orders: `/api/v1/orders`
- Cart: `/api/v1/cart`
- Reviews: `/api/v1/reviews`

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints for tablets and desktops
- Optimized images for different screen sizes
- Touch-friendly interfaces

## 🔒 Security Features

- JWT token validation
- Protected API routes
- Secure payment processing
- Input sanitization
- Rate limiting

## 🎨 UI/UX Features

- Dark/Light mode support
- Loading skeletons
- Toast notifications
- Infinite scrolling
- Smooth animations

## 📈 Performance Optimization

- Image optimization
- Lazy loading
- Code splitting
- API response caching
- Debounced search

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
