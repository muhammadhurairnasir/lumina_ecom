import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import reviewRoutes from './routes/reviewRoutes';
import cartRoutes from './routes/cartRoutes';
import voucherRoutes from './routes/voucherRoutes';
import orderRoutes, { webhookRouter } from './routes/orderRoutes';
import chatbotRoutes from './routes/chatbotRoutes';
import adminRoutes from './routes/adminRoutes';
import blogRoutes from './routes/blogRoutes';
import healthRouter from './routes/healthRoutes';
import { errorHandler } from './middlewares/errorHandler';

// Initialize express app
const app: Application = express();

// --- STRIPE WEBHOOK MUST BE BEFORE EXPRESS.JSON ---
app.use('/api/v1/orders/webhook', express.raw({ type: 'application/json' }), webhookRouter);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin:
    process.env.NODE_ENV === 'production'
      ? [process.env.CLIENT_URL || 'http://localhost:3000']
      : (origin, callback) => {
          // Allow any localhost / LAN dev origin so axios from the browser is not blocked
          if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            callback(null, true);
          } else {
            callback(null, true); // permissive in development
          }
        },
  credentials: true,
}));
app.use(helmet());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/vouchers', voucherRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/chatbot', chatbotRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/blog', blogRoutes);
app.use('/api/v1/health', healthRouter);

// Nested routes
app.use('/api/v1/products/:productId/reviews', reviewRoutes);

// Basic route
app.get('/', (_req: Request, res: Response) => {
  res.send('Ecommerce API is running...');
});

// Global Error Handler
app.use(errorHandler);

export default app;
