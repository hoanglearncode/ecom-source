/**
 * Express Middleware for Request Logging
 * Logs incoming HTTP requests with performance tracking
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';
import { RequestLoggingOptions, PerformanceMetrics } from './logger.types.js';

/**
 * Default request logging options
 */
const defaultOptions: RequestLoggingOptions = {
    excludePaths: ['/health', '/readiness', '/liveness'],
    excludeMethods: [],
    includeQuery: true,
    includeBody: false,
    skipSuccessfulRequests: false,
};

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string {
    return (
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        (req.headers['x-real-ip'] as string) ||
        req.socket.remoteAddress ||
        'unknown'
    );
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
        return body;
    }

    const sensitiveFields = [
        'password',
        'newPassword',
        'oldPassword',
        'confirmPassword',
        'currentPassword',
        'token',
        'accessToken',
        'refreshToken',
        'secret',
        'apiKey',
        'creditCard',
        'ssn',
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
}

/**
 * Generate user agent string
 */
function getUserAgent(req: Request): string {
    return req.headers['user-agent'] || 'unknown';
}

/**
 * Request logging middleware factory
 */
export function requestLoggerMiddleware(options?: Partial<RequestLoggingOptions>) {
    const opts = { ...defaultOptions, ...options };

    return (req: Request, res: Response, next: NextFunction): void => {
        // Generate unique request ID
        const requestId = (req.headers['x-request-id'] as string) || uuidv4();
        req.headers['x-request-id'] = requestId;
        res.setHeader('x-request-id', requestId);

        // Skip logging for excluded paths
        if (opts.excludePaths?.includes(req.path)) {
            return next();
        }

        // Skip logging for excluded methods
        if (opts.excludeMethods?.includes(req.method)) {
            return next();
        }

        // Create child logger with request context
        const requestLogger = logger.child({
            requestId,
            method: req.method,
            route: req.path,
            ip: getClientIp(req),
            userAgent: getUserAgent(req),
        });

        // Attach logger to request for use in other middleware/routes
        (req as any).logger = requestLogger;
        (req as any).requestId = requestId;

        // Store start time for performance tracking
        const startTime = Date.now();
        const startMemory = process.memoryUsage();

        // Log request start
        const requestInfo: any = {
            method: req.method,
            path: req.path,
            query: opts.includeQuery ? req.query : undefined,
        };

        if (opts.includeBody && req.body && Object.keys(req.body).length > 0) {
            requestInfo.body = sanitizeBody(req.body);
        }

        requestLogger.http('Incoming request', requestInfo);

        // Capture original end function
        const originalEnd = res.end;

        // Override res.end to log response
        res.end = function (chunk?: any, encoding?: any) {
            res.end = originalEnd;
            res.end(chunk, encoding);

            const duration = Date.now() - startTime;
            const endMemory = process.memoryUsage();

            // Determine log level based on status code
            const statusCode = res.statusCode;
            let logLevel: string = 'info';

            if (statusCode >= 500) {
                logLevel = 'error';
            } else if (statusCode >= 400) {
                logLevel = 'warn';
            } else if (statusCode >= 300) {
                logLevel = 'http';
            }

            // Skip successful requests if option is enabled
            if (opts.skipSuccessfulRequests && statusCode < 400) {
                return;
            }

            // Prepare response log data
            const responseInfo: any = {
                method: req.method,
                path: req.path,
                statusCode,
                duration: `${duration}ms`,
            };

            // Add memory usage for long-running requests
            if (duration > 1000) {
                const memoryDiff = {
                    heapUsed: `${(endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024}MB`,
                    heapTotal: `${(endMemory.heapTotal - startMemory.heapTotal) / 1024 / 1024}MB`,
                };
                responseInfo.memoryDelta = memoryDiff;
            }

            // Add performance metrics
            const metrics: PerformanceMetrics = {
                duration,
                memoryUsage: {
                    heapUsed: endMemory.heapUsed,
                    heapTotal: endMemory.heapTotal,
                    external: endMemory.external,
                },
            };

            // Log response
            if (logLevel === 'error') {
                requestLogger.error('Request completed with error', { ...responseInfo, metrics });
            } else if (logLevel === 'warn') {
                requestLogger.warn('Request completed with warning', responseInfo);
            } else {
                requestLogger.http('Request completed', responseInfo);
            }

            // Log slow requests as warnings
            if (duration > 3000) {
                requestLogger.warn('Slow request detected', {
                    ...requestInfo,
                    statusCode,
                    duration: `${duration}ms`,
                });
            }
        };

        next();
    };
}

/**
 * Error logging middleware
 * Should be used after all other middleware and routes
 */
export function errorLoggingMiddleware(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const requestLogger = (req as any).logger || logger;

    // Log error details
    requestLogger.error('Unhandled error in request', {
        error: {
            message: err.message,
            name: err.name,
            stack: err.stack,
            cause: err.cause,
        },
        request: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: sanitizeBody(req.body),
            headers: req.headers,
        },
    });

    // Pass error to next error handler
    next(err);
}

/**
 * 404 Not Found logging middleware
 */
export function notFoundLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
    const requestLogger = (req as any).logger || logger;

    requestLogger.warn('Resource not found', {
        method: req.method,
        path: req.path,
        query: req.query,
    });

    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        requestId: (req as any).requestId,
    });
}

/**
 * Security event logging middleware
 * Logs security-related events like authentication failures
 */
export function securityEventMiddleware(
    eventType: string,
    options: { logBody?: boolean; logHeaders?: boolean } = {},
) {
    return (req: Request, res: Response, next: NextFunction) => {
        const requestLogger = (req as any).logger || logger;

        // Log original request data before processing
        const securityData: any = {
            eventType,
            method: req.method,
            path: req.path,
            ip: getClientIp(req),
            userAgent: getUserAgent(req),
        };

        if (options.logBody && req.body) {
            securityData.body = sanitizeBody(req.body);
        }

        if (options.logHeaders) {
            securityData.headers = {
                authorization: req.headers.authorization ? '[REDACTED]' : undefined,
                contentType: req.headers['content-type'],
                origin: req.headers.origin,
                referer: req.headers.referer,
            };
        }

        requestLogger.warn('Security event', securityData);

        // Capture response to log result
        const originalEnd = res.end;
        res.end = function (chunk?: any, encoding?: any) {
            res.end = originalEnd;
            res.end(chunk, encoding);

            requestLogger.warn('Security event result', {
                eventType,
                statusCode: res.statusCode,
                success: res.statusCode < 400,
            });
        };

        next();
    };
}

/**
 * Rate limit exceeded logging
 */
export function logRateLimitExceeded(req: Request): void {
    const requestLogger = (req as any).logger || logger;

    requestLogger.warn('Rate limit exceeded', {
        method: req.method,
        path: req.path,
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
    });
}

/**
 * Authentication failure logging
 */
export function logAuthFailure(req: Request, reason: string): void {
    const requestLogger = (req as any).logger || logger;

    requestLogger.warn('Authentication failed', {
        method: req.method,
        path: req.path,
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
        reason,
    });
}

/**
 * Authentication success logging
 */
export function logAuthSuccess(req: Request, userId?: string): void {
    const requestLogger = (req as any).logger || logger;

    requestLogger.info('Authentication successful', {
        method: req.method,
        path: req.path,
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
        userId,
    });
}
