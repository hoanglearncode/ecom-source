/**
 * Error Handler Middleware
 * Global error handling middleware for Express
 * Maps domain errors to appropriate HTTP responses using ResponseFormatter
 */

import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../../domain/domain-error/index.js';
import { ResponseFormatter } from '../../response-formatter/index.js';
import { logger } from '../../../shared/logger/index.js';

// ============================================================
// Error Handler Types
// ============================================================

interface AppError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
    isOperational?: boolean;
}

// ============================================================
// Error Handler Middleware
// ============================================================

/**
 * Global error handler middleware
 * Catches all errors and formats them appropriately
 */
export function errorHandler(
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction,
): void {
    // Log error
    logError(err, req);

    // Handle known domain errors
    if (err instanceof DomainError) {
        ResponseFormatter.error(
            res,
            err.code,
            err.message,
            err.statusCode,
            err.details,
        );
        return;
    }

    // Handle operational errors (expected errors)
    if (err.isOperational) {
        ResponseFormatter.error(
            res,
            err.code || 'OPERATIONAL_ERROR',
            err.message,
            err.statusCode || 500,
            err.details,
        );
        return;
    }

    // Handle unexpected errors
    handleUnexpectedError(err, req, res);
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Log error with context
 */
function logError(err: AppError, req: Request): void {
    const errorContext = {
        requestId: req.id,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        statusCode: err.statusCode || 500,
        code: err.code || 'UNKNOWN',
    };

    if (err instanceof DomainError) {
        // Domain errors are expected business logic errors
        logger.warn(`Domain Error: ${err.message}`, {
            context: errorContext,
            metadata: {
                domainError: err.code,
                statusCode: err.statusCode,
            },
        });
    } else if (err.isOperational) {
        // Operational errors are expected but not domain errors
        logger.warn(`Operational Error: ${err.message}`, {
            context: errorContext,
            metadata: {
                operational: true,
            },
        });
    } else {
        // Unexpected errors - always log at error level
        logger.error(`Unexpected Error: ${err.message}`, {
            context: errorContext,
            metadata: {
                stack: err.stack,
                name: err.name,
            },
        });
    }
}

/**
 * Handle unexpected/unknown errors
 */
function handleUnexpectedError(err: AppError, req: Request, res: Response): void {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // In development, send full error details
    // In production, send generic error message
    const message = isDevelopment
        ? err.message
        : 'An unexpected error occurred. Please try again later.';

    const errorResponse = {
        success: false,
        error: {
            code: err.code || 'INTERNAL_SERVER_ERROR',
            message,
            statusCode: err.statusCode || 500,
            ...(isDevelopment && { stack: err.stack }),
        },
    };

    res.status(err.statusCode || 500).json(errorResponse);
}

// ============================================================
// Error Factory Functions
// ============================================================

/**
 * Create operational error (expected error)
 */
export class OperationalError extends Error implements AppError {
    statusCode: number;
    code: string;
    isOperational = true;

    constructor(message: string, statusCode: number = 500, code: string = 'OPERATIONAL_ERROR') {
        super(message);
        this.name = 'OperationalError';
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Create not found error
 */
export class NotFoundError extends OperationalError {
    constructor(message: string = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

/**
 * Create validation error
 */
export class BadRequestError extends OperationalError {
    details?: any;

    constructor(message: string, details?: any) {
        super(message, 400, 'BAD_REQUEST');
        this.name = 'BadRequestError';
        this.details = details;
    }
}

/**
 * Create unauthorized error
 */
export class UnauthorizedError extends OperationalError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}

/**
 * Create forbidden error
 */
export class ForbiddenError extends OperationalError {
    constructor(message: string = 'Access forbidden') {
        super(message, 403, 'FORBIDDEN');
        this.name = 'ForbiddenError';
    }
}

/**
 * Create conflict error
 */
export class ConflictError extends OperationalError {
    constructor(message: string = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
        this.name = 'ConflictError';
    }
}

/**
 * Create rate limit error
 */
export class RateLimitError extends OperationalError {
    constructor(message: string = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
        this.name = 'RateLimitError';
    }
}

/**
 * Create service unavailable error
 */
export class ServiceUnavailableError extends OperationalError {
    constructor(message: string = 'Service temporarily unavailable') {
        super(message, 503, 'SERVICE_UNAVAILABLE');
        this.name = 'ServiceUnavailableError';
    }
}

// ============================================================
// Async Error Wrapper
// ============================================================

/**
 * Wrapper for async route handlers to catch errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// ============================================================
// 404 Handler
// ============================================================

/**
 * Handle 404 Not Found errors
 */
export function notFoundHandler(req: Request, res: Response): void {
    logger.warn(`404 Not Found: ${req.method} ${req.path}`, {
        context: {
            requestId: req.id,
            method: req.method,
            path: req.path,
            ip: req.ip,
        },
    });

    ResponseFormatter.notFound(res, `Cannot ${req.method} ${req.path}`);
}

// ============================================================
// Validation Error Handler
// ============================================================

/**
 * Handle validation errors from request validation middleware
 */
export function validationErrorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    if (err.name === 'ValidationError' || err.name === 'AJVValidationError') {
        const details =
            err.errors?.map((e: any) => ({
                field: e.field || e.param || e.instancePath,
                message: e.message || e.msg,
                code: e.code,
            })) || [];

        logger.debug(`Validation Error: ${req.method} ${req.path}`, {
            context: {
                requestId: req.id,
                method: req.method,
                path: req.path,
            },
            metadata: {
                validationErrors: details,
            },
        });

        ResponseFormatter.validationError(res, details);
        return;
    }

    next(err);
}

// ============================================================
// Export all handlers
// ============================================================

export default errorHandler;
