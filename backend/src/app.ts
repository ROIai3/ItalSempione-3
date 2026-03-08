import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import shipmentRoutes from './routes/shipments';
import trackingRoutes from './routes/tracking';
import dashboardRoutes from './routes/dashboard';

const app = express();

// ---------------------
// Security & parsing
// ---------------------
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------------------
// Request logging
// ---------------------
app.use(
  morgan('short', {
    skip: (req) => req.url === '/health',
  })
);

// ---------------------
// Health check (public)
// ---------------------
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ---------------------
// API routes
// ---------------------
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ---------------------
// 404 handler
// ---------------------
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    statusCode: 404,
  });
});

// ---------------------
// Global error handler
// ---------------------
app.use(errorHandler);

export default app;
