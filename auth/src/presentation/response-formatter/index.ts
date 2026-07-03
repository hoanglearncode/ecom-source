/**
 * Response Formatter Index
 * Exports all response formatters and utilities
 */

import { Response } from 'express';

// ============================================================
// Response Types
// ============================================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
        [key: string]: unknown;
    };
    message?: string;
}

export interface PaginatedResponse<T = unknown> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}

// ============================================================
// Response Formatter Class
// ============================================================

export class ResponseFormatter {
    /**
     * Success response with data
     */
    static success<T>(
        res: Response,
        data: T,
        statusCode: number = 200,
        meta?: Record<string, unknown>,
    ): Response {
        const response: ApiResponse<T> = {
            success: true,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                ...meta,
            },
        };
        return res.status(statusCode).json(response);
    }

    /**
     * Created response (201)
     */
    static created<T>(
        res: Response,
        data: T,
        meta?: Record<string, unknown>,
    ): Response {
        return this.success(res, data, 201, meta);
    }

    /**
     * No content response (204)
     */
    static noContent(res: Response): Response {
        return res.status(204).send();
    }

    /**
     * Accepted response (202) - for async processing
     */
    static accepted<T>(
        res: Response,
        data?: T,
        meta?: Record<string, unknown>,
    ): Response {
        return this.success(res, data || {}, 202, meta);
    }

    /**
     * Paginated response
     */
    static paginated<T>(
        res: Response,
        data: T[],
        pagination: {
            page: number;
            limit: number;
            total: number;
        },
        meta?: Record<string, unknown>,
    ): Response {
        const totalPages = Math.ceil(pagination.total / pagination.limit);
        const response: PaginatedResponse<T> = {
            success: true,
            data,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages,
                hasNext: pagination.page < totalPages,
                hasPrev: pagination.page > 1,
            },
            meta: {
                timestamp: new Date().toISOString(),
                ...meta,
            },
        };
        return res.status(200).json(response);
    }

    /**
     * Error response
     */
    static error(
        res: Response,
        code: string,
        message: string,
        statusCode: number = 400,
        details?: unknown,
    ): Response {
        const response: ApiResponse = {
            success: false,
            error: {
                code,
                message,
                details,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
        return res.status(statusCode).json(response);
    }

    /**
     * Validation error response
     */
    static validationError(
        res: Response,
        errors: Array<{ field: string; message: string }>,
    ): Response {
        return this.error(
            res,
            'VALIDATION_ERROR',
            'Validation failed',
            400,
            { errors },
        );
    }

    /**
     * Not found response
     */
    static notFound(
        res: Response,
        message: string = 'Resource not found',
    ): Response {
        return this.error(res, 'NOT_FOUND', message, 404);
    }

    /**
     * Unauthorized response
     */
    static unauthorized(
        res: Response,
        message: string = 'Authentication required',
    ): Response {
        return this.error(res, 'UNAUTHORIZED', message, 401);
    }

    /**
     * Forbidden response
     */
    static forbidden(
        res: Response,
        message: string = 'Access forbidden',
    ): Response {
        return this.error(res, 'FORBIDDEN', message, 403);
    }

    /**
     * Conflict response
     */
    static conflict(
        res: Response,
        message: string = 'Resource already exists',
    ): Response {
        return this.error(res, 'CONFLICT', message, 409);
    }

    /**
     * Rate limit response
     */
    static rateLimit(
        res: Response,
        retryAfter?: number,
    ): Response {
        if (retryAfter) {
            res.setHeader('Retry-After', retryAfter);
        }
        return this.error(
            res,
            'RATE_LIMIT_EXCEEDED',
            'Too many requests. Please try again later',
            429,
        );
    }

    /**
     * Server error response
     */
    static serverError(
        res: Response,
        message: string = 'Internal server error',
    ): Response {
        return this.error(res, 'SERVER_ERROR', message, 500);
    }
}

// ============================================================
// Export RegisterResponse from auth.ts
// ============================================================

export type { RegisterResponse } from './auth.js';
