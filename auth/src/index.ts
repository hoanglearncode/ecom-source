/**
 * Auth Service Entry Point
 * Hexagonal Architecture Implementation
 *
 * This file initializes and starts the Auth Service following hexagonal architecture:
 * - Domain Layer (Core): Entities, Value Objects, Repository Interfaces (Ports)
 * - Application Layer: Use Cases, DTOs, Error Handling
 * - Infrastructure Layer: Repository Implementations (Adapters), External Services
 * - Presentation Layer: Controllers, Routes, Middleware
 *
 * Flow:
 * 1. Initialize DI Container with all dependencies
 * 2. Setup Express app with middleware
 * 3. Mount routes from controllers
 * 4. Start server
 */

import express from 'express';
import { diContainer } from '@/di/container.js';
import { authConfig } from '@/config/index.js';
import { logger } from '@/shared/logger/index.js';
import { buildRoutes } from '@/presentation/http/routes.js';
import { errorHandler } from '@/presentation/http/middleware/error-handler.middleware.js';

// ============================================================
// Express App Setup
// ============================================================

const app: express.Application = express();

const PORT = authConfig.PORT || 8081;
const version = authConfig.version || '1.0.0';
const environment = authConfig.NODE_ENV || 'development';

// ============================================================
// Middleware
// ============================================================

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    logger.info('Incoming request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});

// Health check endpoint (before routes)
app.get('/health', (req, res) => {
    logger.info('Health check endpoint was called', {
        route: '/health',
        method: 'GET',
    });
    res.status(200).json({
        status: 'ok',
        service: 'auth-service',
        version,
        environment,
        timestamp: new Date().toISOString(),
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'Auth Service',
        version,
        status: 'running',
        endpoints: {
            health: '/health',
            api: '/v1',
            docs: '/v1/docs',
        },
    });
});

// ============================================================
// Server Startup
// ============================================================

const buildAuthApp = async (): Promise<void> => {
    try {
        logger.info('Building Auth Service...', { environment, port: PORT });

        // Initialize DI Container (sets up all dependencies)
        logger.info('Initializing DI Container...');

        // Get Prisma service to ensure database connection is established
        const prismaService = diContainer.getPrismaService();
        await prismaService.client.$connect();
        logger.info('Database connected successfully');

        // Optional: Check Redis connection
        const cacheService = diContainer.getCacheService();
        const redisPing = await cacheService.ping();
        if (redisPing) {
            logger.info('Redis connected successfully');
        } else {
            logger.warn('Redis connection failed - cache features may be limited');
        }

        // ============================================================
        // Mount API Routes AFTER DI Container is ready
        // ============================================================
        app.use('/', buildRoutes());

        // Start listening
        app.listen(PORT, () => {
            logger.info(`🚀 Auth Service running on port http://localhost:${PORT}`);
            logger.info(`📚 Environment: ${environment}`);
            logger.info(`🔧 Health check: http://localhost:${PORT}/health`);
            logger.info(`🌐 API base: http://localhost:${PORT}/v1`);
        });
    } catch (error) {
        logger.error('Failed to build Auth Service', { error });
        process.exit(1);
    }
};

// ============================================================
// Graceful Shutdown
// ============================================================

const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    try {
        // Cleanup DI container resources
        await diContainer.cleanup();

        logger.info('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        logger.error('Error during graceful shutdown', { error });
        process.exit(1);
    }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error });
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason });
    gracefulShutdown('unhandledRejection');
});

// ============================================================
// Start the Application
// ============================================================

buildAuthApp();

export { app, diContainer };
