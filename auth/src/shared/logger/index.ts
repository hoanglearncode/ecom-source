/**
 * Logger Module Index
 * Exports all logger functionality
 */

// Main logger
export { logger, createLogger, getWinstonLogger } from './logger.js';

// Types and interfaces
export type {
    LogLevel,
    LogMetadata,
    LogContext,
    LogEntry,
    SecurityEventType,
    SecurityEventEntry,
    PerformanceMetrics,
    RequestLoggingOptions,
    ChildLoggerOptions,
} from './logger.types.js';

// Middleware
export {
    requestLoggerMiddleware,
    errorLoggingMiddleware,
    notFoundLoggingMiddleware,
    securityEventMiddleware,
    logRateLimitExceeded,
    logAuthFailure,
    logAuthSuccess,
} from './logger.middleware.js';

// Decorators
export {
    LogMethod,
    LogClass,
    withLogging,
    measureTime,
    withRetry,
    CircuitBreaker,
} from './logger.decorator.js';

// Utilities
export {
    securityLogger,
    errorLogger,
    performanceLogger,
    setupGlobalErrorHandlers,
    logHealthCheck,
} from './logger.utils.js';
