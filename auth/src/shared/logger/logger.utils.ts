/**
 * Error and Security Logger Utilities
 * Specialized logging functions for error handling and security events
 */

import { logger } from './logger.js';
import { SecurityEventType, SecurityEventEntry, LogMetadata } from './logger.types.js';

/**
 * Security Logger Class
 * Handles logging of security-related events
 */
class SecurityLogger {
    /**
     * Log a security event
     */
    private logSecurityEvent(entry: SecurityEventEntry): void {
        const securityLogger = logger.child({
            eventType: entry.eventType,
            securityEvent: true,
            severity: entry.severity,
        });

        const logData: LogMetadata = {
            userId: entry.userId,
            ip: entry.ip,
            userAgent: entry.userAgent,
            resourceId: entry.resourceId,
            ...entry.details,
        };

        // Determine log level based on severity
        switch (entry.severity) {
            case 'critical':
            case 'high':
                securityLogger.error(`Security: ${entry.eventType}`, logData);
                break;
            case 'medium':
                securityLogger.warn(`Security: ${entry.eventType}`, logData);
                break;
            default:
                securityLogger.info(`Security: ${entry.eventType}`, logData);
        }
    }

    /**
     * Log successful authentication
     */
    public loginSuccess(userId: string, ip?: string, userAgent?: string): void {
        this.logSecurityEvent({
            eventType: SecurityEventType.LOGIN_SUCCESS,
            userId,
            ip,
            userAgent,
            severity: 'low',
        });
    }

    /**
     * Log failed authentication
     */
    public loginFailed(ip?: string, userAgent?: string, reason?: string, userId?: string): void {
        this.logSecurityEvent({
            eventType: SecurityEventType.LOGIN_FAILED,
            userId,
            ip,
            userAgent,
            details: { reason },
            severity: 'medium',
        });
    }

    /**
     * Log logout event
     */
    public logout(userId: string, ip?: string, userAgent?: string): void {
        this.logSecurityEvent({
            eventType: SecurityEventType.LOGOUT,
            userId,
            ip,
            userAgent,
            severity: 'low',
        });
    }

    /**
     * Log token refresh
     */
    public tokenRefresh(userId: string, ip?: string, userAgent?: string): void {
        this.logSecurityEvent({
            eventType: SecurityEventType.TOKEN_REFRESH,
            userId,
            ip,
            userAgent,
            severity: 'low',
        });
    }

    /**
     * Log invalid token usage
     */
    public tokenInvalid(ip?: string, userAgent?: string, tokenType?: string): void {
        this.logSecurityEvent({
            eventType: SecurityEventType.TOKEN_INVALID,
            ip,
            userAgent,
            details: { tokenType },
            severity: 'medium',
        });
    }

    /**
     * Log expired token usage
     */
    public tokenExpired(ip?: string, userAgent?: string, tokenType?: string): void {
        this.logSecurityEvent({
            eventType: SecurityEventType.TOKEN_EXPIRED,
            ip,
            userAgent,
            details: { tokenType },
            severity: 'low',
        });
    }

    /**
     * Log password change
     */
    public passwordChanged(userId: string, ip?: string, userAgent?: string): void {
        this.logSecurityEvent({
            eventType: SecurityEventType.PASSWORD_CHANGE,
            userId,
            ip,
            userAgent,
            severity: 'medium',
        });
    }

    /**
     * Log password reset request
     */
    public passwordResetRequested(
        userId?: string,
        email?: string,
        ip?: string,
        userAgent?: string,
    ): void {
        this.logSecurityEvent({
            eventType: SecurityEventType.PASSWORD_RESET,
            userId,
            ip,
            userAgent,
            details: { email },
            severity: 'medium',
        });
    }

    /**
     * Log 2FA enabled
     */
    public twoFactorEnabled(userId: string, ip?: string, userAgent?: string): void {
        this.logSecurityEvent({
            eventType: SecurityEventType.TWO_FACTOR_ENABLED,
            userId,
            ip,
            userAgent,
            severity: 'low',
        });
    }

    /**
     * Log 2FA disabled
     */
    public twoFactorDisabled(userId: string, ip?: string, userAgent?: string): void {
        this.logSecurityEvent({
            eventType: SecurityEventType.TWO_FACTOR_DISABLED,
            userId,
            ip,
            userAgent,
            severity: 'medium',
        });
    }

    /**
     * Log 2FA verification failed
     */
    public twoFactorFailed(userId: string, ip?: string, userAgent?: string, reason?: string): void {
        this.logSecurityEvent({
            eventType: SecurityEventType.TWO_FACTOR_FAILED,
            userId,
            ip,
            userAgent,
            details: { reason },
            severity: 'medium',
        });
    }

    /**
     * Log suspicious activity
     */
    public suspiciousActivity(
        description: string,
        userId?: string,
        ip?: string,
        userAgent?: string,
        details?: LogMetadata,
    ): void {
        this.logSecurityEvent({
            eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
            userId,
            ip,
            userAgent,
            details: { description, ...details },
            severity: 'high',
        });
    }

    /**
     * Log rate limit exceeded
     */
    public rateLimitExceeded(
        ip: string,
        userAgent?: string,
        endpoint?: string,
        limit?: number,
    ): void {
        this.logSecurityEvent({
            eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
            ip,
            userAgent,
            details: { endpoint, limit },
            severity: 'medium',
        });
    }

    /**
     * Log unauthorized access attempt
     */
    public unauthorizedAccess(
        resource: string,
        userId?: string,
        ip?: string,
        userAgent?: string,
    ): void {
        this.logSecurityEvent({
            eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
            userId,
            ip,
            userAgent,
            resourceId: resource,
            severity: 'high',
        });
    }
}

/**
 * Error Logger Class
 * Handles logging of errors with context
 */
class ErrorLogger {
    /**
     * Log an error with full context
     */
    public logError(message: string, error?: Error, context?: LogMetadata): void {
        const errorLogger = logger.child({
            errorType: error?.name,
            errorMessage: error?.message,
            ...context,
        });

        const metadata: LogMetadata = {
            ...context,
            ...(error && {
                errorMessage: error.message,
                errorName: error.name,
                errorStack: error.stack,
                errorCause: error.cause,
            }),
        };

        errorLogger.error(message, error || metadata);
    }

    /**
     * Log database errors
     */
    public databaseError(operation: string, error: Error, query?: string): void {
        const dbLogger = logger.child({
            errorType: 'database',
            operation,
        });

        dbLogger.error('Database error occurred', {
            operation,
            query,
            error: {
                message: error.message,
                name: error.name,
                code: (error as any).code,
                detail: (error as any).detail,
            },
        });
    }

    /**
     * Log validation errors
     */
    public validationError(
        field: string,
        value: any,
        message: string,
        context?: LogMetadata,
    ): void {
        logger.warn('Validation error', {
            field,
            value,
            message,
            ...context,
        });
    }

    /**
     * Log external service errors
     */
    public externalServiceError(
        service: string,
        operation: string,
        error: Error,
        context?: LogMetadata,
    ): void {
        const extLogger = logger.child({
            errorType: 'external_service',
            service,
            operation,
        });

        extLogger.error(`External service error: ${service}`, {
            service,
            operation,
            errorMessage: error.message,
            errorStack: error.stack,
            ...context,
        });
    }

    /**
     * Log cache errors
     */
    public cacheError(operation: string, key?: string, error?: Error): void {
        logger.warn('Cache operation failed', {
            operation,
            key,
            errorMessage: error?.message,
            errorStack: error?.stack,
        });
    }

    /**
     * Log API errors (non-200 responses)
     */
    public apiError(url: string, method: string, statusCode: number, responseBody?: string): void {
        logger.error('API request failed', {
            url,
            method,
            statusCode,
            responseBody,
        });
    }

    /**
     * Log unhandled promise rejections
     */
    public unhandledRejection(reason: any, promise?: Promise<any>): void {
        logger.error('Unhandled promise rejection', {
            reason,
            promiseStack: promise,
            stack: reason instanceof Error ? reason.stack : undefined,
        });
    }

    /**
     * Log uncaught exceptions
     */
    public uncaughtException(error: Error): void {
        logger.error('Uncaught exception', {
            error: {
                message: error.message,
                name: error.name,
                stack: error.stack,
            },
        });
    }
}

/**
 * Performance Logger Class
 * Handles logging of performance metrics
 */
class PerformanceLogger {
    private metrics: Map<string, number[]> = new Map();

    /**
     * Record a metric value
     */
    public recordMetric(name: string, value: number): void {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name)!.push(value);
    }

    /**
     * Log slow database queries
     */
    public slowDatabaseQuery(query: string, duration: number, threshold: number = 1000): void {
        if (duration > threshold) {
            logger.warn('Slow database query detected', {
                query,
                duration: `${duration}ms`,
                threshold: `${threshold}ms`,
            });
            this.recordMetric('slow_queries', duration);
        }
    }

    /**
     * Log slow API calls
     */
    public slowApiCall(url: string, duration: number, threshold: number = 3000): void {
        if (duration > threshold) {
            logger.warn('Slow API call detected', {
                url,
                duration: `${duration}ms`,
                threshold: `${threshold}ms`,
            });
            this.recordMetric('slow_api_calls', duration);
        }
    }

    /**
     * Log memory usage
     */
    public logMemoryUsage(label?: string): void {
        const usage = process.memoryUsage();
        logger.debug('Memory usage', {
            label,
            heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
            heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
            rss: `${(usage.rss / 1024 / 1024).toFixed(2)}MB`,
            external: `${(usage.external / 1024 / 1024).toFixed(2)}MB`,
        });
    }

    /**
     * Get statistics for a metric
     */
    public getMetricStats(name: string): {
        count: number;
        min: number;
        max: number;
        avg: number;
    } | null {
        const values = this.metrics.get(name);
        if (!values || values.length === 0) {
            return null;
        }

        const sum = values.reduce((a, b) => a + b, 0);
        return {
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: sum / values.length,
        };
    }

    /**
     * Log metric statistics
     */
    public logMetricStats(name: string): void {
        const stats = this.getMetricStats(name);
        if (stats) {
            logger.info(`Metric stats: ${name}`, stats);
        }
    }
}

/**
 * Export singleton instances
 */
export const securityLogger = new SecurityLogger();
export const errorLogger = new ErrorLogger();
export const performanceLogger = new PerformanceLogger();

/**
 * Set up global error handlers
 */
export function setupGlobalErrorHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
        errorLogger.uncaughtException(error);
        // Exit after logging
        setTimeout(() => process.exit(1), 1000).unref();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
        errorLogger.unhandledRejection(reason);
    });

    logger.info('Global error handlers registered');
}

/**
 * Health check logging
 */
export function logHealthCheck(
    service: string,
    status: 'healthy' | 'unhealthy' | 'degraded',
    details?: LogMetadata,
): void {
    const healthLogger = logger.child({ healthCheck: true });

    if (status === 'healthy') {
        healthLogger.info(`Health check: ${service}`, { status, ...details });
    } else if (status === 'degraded') {
        healthLogger.warn(`Health check: ${service}`, { status, ...details });
    } else {
        healthLogger.error(`Health check: ${service}`, { status, ...details });
    }
}
