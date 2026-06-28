import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { closeRedisConnection } from './utils/tokenBlacklist.js';
import { UserModel } from './models/user.js';
import authRouter from './routes/auth.js';
import { authenticate, optionalAuth } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'auth-service'
  });
});

// API Routes
app.use('/api/auth', authRouter);

// Protected route example
app.get('/api/protected', authenticate, (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Access granted to protected resource',
    user: _req.user
  });
});

// Admin-only route example
app.get('/api/admin', authenticate, (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  res.json({
    success: true,
    message: 'Admin access granted'
  });
});

// Optional auth route example
app.get('/api/public', optionalAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Public endpoint',
    user: req.user || null
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const shutdown = async (): Promise<void> => {
  console.log('Shutting down gracefully...');
  await UserModel.closeConnections();
  await closeRedisConnection();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
