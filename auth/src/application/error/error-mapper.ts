/**
 * Error Mapper
 * Maps external errors (Prisma, JWT, Redis, etc.) to domain errors
 */

import {
    DomainError,
    UserError,
    AuthError,
    TokenError,
    TwoFactorError,
    VerificationError,
    RateLimitError,
    ValidationError,
    InfrastructureError,
} from '../../domain/domain-error/index.js';
import { logger } from '../../shared/logger/index.js';

// ============================================================
// External Error Types
// ============================================================

interface PrismaError extends Error {
    code?: string;
    meta?: {
        target?: string[];
        field?: string;
    };
}

interface JWTError extends Error {
    name: string;
    code?: string;
}

interface RedisError extends Error {
    code?: string;
    command?: string;
}

// ============================================================
// Error Mapper Class
// ============================================================

export class ErrorMapper {
    /**
     * Map Prisma error to domain error
     */
    static fromPrisma(error: PrismaError): DomainError {
        logger.debug(`Mapping Prisma error: ${error.code}`, {
            metadata: { prismaCode: error.code, meta: error.meta },
        });

        switch (error.code) {
            case 'P2002':
                // Unique constraint violation
                const target = error.meta?.target?.[0] || 'field';
                if (target === 'email') {
                    return UserError.EMAIL_EXISTS;
                }
                if (target === 'phone') {
                    return UserError.PHONE_EXISTS;
                }
                if (target === 'username') {
                    return UserError.USERNAME_EXISTS;
                }
                return new ValidationError('DUPLICATE_FIELD', `${target} already exists`, 409);

            case 'P2025':
                // Record not found
                return new ValidationError('NOT_FOUND', 'Record not found', 404);

            case 'P2003':
                // Foreign key constraint failed
                return new ValidationError(
                    'INVALID_REFERENCE',
                    'Referenced record does not exist',
                    400,
                );

            case 'P2014':
                // Required relation violation
                return new ValidationError(
                    'REQUIRED_RELATION',
                    'Required relation is missing',
                    400,
                );

            case 'P2000':
                // Value too long
                return new ValidationError('VALUE_TOO_LONG', 'Provided value is too long', 400);

            case 'P2006':
                // Invalid value
                return new ValidationError('INVALID_VALUE', 'Provided value is invalid', 400);

            case 'P2009':
                // Validation error
                return new ValidationError('VALIDATION_FAILED', 'Query validation failed', 400);

            case 'P2011':
                // Null constraint violation
                const nullField = error.meta?.field || 'field';
                return ValidationError.REQUIRED_FIELD(nullField);

            case 'P2023':
                // Inconsistent column data
                return new ValidationError('INCONSISTENT_DATA', 'Inconsistent column data', 400);

            default:
                // Unknown Prisma error - treat as infrastructure error
                logger.error(`Unknown Prisma error: ${error.code}`, {
                    metadata: { prismaCode: error.code, message: error.message },
                });
                return InfrastructureError.DATABASE_ERROR;
        }
    }

    /**
     * Map JWT error to domain error
     */
    static fromJWT(error: JWTError): DomainError {
        logger.debug(`Mapping JWT error: ${error.name}`, {
            metadata: { jwtName: error.name, jwtCode: error.code },
        });

        switch (error.name) {
            case 'TokenExpiredError':
                return AuthError.EXPIRED_TOKEN;

            case 'JsonWebTokenError':
                if (error.message.includes('malformed')) {
                    return AuthError.MALFORMED_TOKEN;
                }
                if (error.message.includes('invalid')) {
                    return AuthError.INVALID_TOKEN;
                }
                return AuthError.INVALID_TOKEN;

            case 'NotBeforeError':
                return AuthError.INVALID_TOKEN;

            default:
                logger.error(`Unknown JWT error: ${error.name}`, {
                    metadata: { message: error.message },
                });
                return TokenError.TOKEN_GENERATION_FAILED;
        }
    }

    /**
     * Map Redis error to domain error
     */
    static fromRedis(error: RedisError): DomainError {
        logger.debug(`Mapping Redis error: ${error.code}`, {
            metadata: { redisCode: error.code, command: error.command },
        });

        switch (error.code) {
            case 'WRONGTYPE':
            case 'OOM':
            case 'NOAUTH':
                return InfrastructureError.CACHE_ERROR;

            case 'NOREPLICAS':
            case 'LOADING':
            case 'MASTERDOWN':
                return InfrastructureError.CACHE_ERROR;

            default:
                logger.error(`Unknown Redis error: ${error.code}`, {
                    metadata: { message: error.message },
                });
                return InfrastructureError.CACHE_ERROR;
        }
    }

    /**
     * Map rate limit error to domain error
     */
    static fromRateLimit(error: Error): RateLimitError {
        logger.debug('Mapping rate limit error', {
            metadata: { message: error.message },
        });

        if (error.message.includes('login')) {
            return RateLimitError.TOO_MANY_LOGIN_ATTEMPTS;
        }

        if (error.message.includes('OTP') || error.message.includes('verification')) {
            return RateLimitError.TOO_MANY_OTP_REQUESTS;
        }

        if (error.message.includes('IP') || error.message.includes('blocked')) {
            return RateLimitError.IP_BLOCKED;
        }

        return RateLimitError.TOO_MANY_REQUESTS;
    }

    /**
     * Map validation error from external validator (e.g., AJV, Zod)
     */
    static fromValidation(
        errors: Array<{ field?: string; message: string; path?: string }>,
        defaultMessage: string = 'Validation failed',
    ): ValidationError {
        logger.debug('Mapping validation errors', {
            metadata: { errorCount: errors.length },
        });

        if (errors.length === 1) {
            const err = errors[0];
            const field = err.field || err.path?.split('.').pop() || 'field';
            return ValidationError.INVALID_FORMAT(field);
        }

        return new ValidationError('VALIDATION_FAILED', defaultMessage, 400);
    }

    /**
     * Map network/timeout errors
     */
    static fromNetwork(error: Error): DomainError {
        logger.debug('Mapping network error', {
            metadata: { message: error.message, name: error.name },
        });

        if (error.message.includes('timeout') || error.name === 'TimeoutError') {
            return new InfrastructureError(
                'TIMEOUT_ERROR',
                'Request timeout. Please try again.',
                504,
            );
        }

        if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
            return InfrastructureError.EXTERNAL_SERVICE_ERROR;
        }

        if (error.message.includes('ETIMEDOUT')) {
            return InfrastructureError.EXTERNAL_SERVICE_ERROR;
        }

        return InfrastructureError.EXTERNAL_SERVICE_ERROR;
    }

    /**
     * Map OAuth provider errors
     */
    static fromOAuth(provider: string, error: any): DomainError {
        logger.debug(`Mapping OAuth error for ${provider}`, {
            metadata: { oauthError: error },
        });

        switch (error?.error || error?.type) {
            case 'access_denied':
            case 'user_cancelled':
                return new AuthError('OAUTH_ACCESS_DENIED', 'Access denied by user', 403);

            case 'invalid_client':
            case 'invalid_grant':
            case 'unauthorized_client':
                return new AuthError('OAUTH_AUTH_CODE_INVALID', 'Invalid authorization code', 401);

            case 'invalid_request':
                return new ValidationError('OAUTH_INVALID_REQUEST', 'Invalid OAuth request', 400);

            case 'unsupported_response_type':
                return new ValidationError(
                    'OAUTH_UNSUPPORTED_TYPE',
                    'Unsupported response type',
                    400,
                );

            case 'temporarily_unavailable':
                return InfrastructureError.EXTERNAL_SERVICE_ERROR;

            default:
                logger.error(`Unknown OAuth error for ${provider}`, {
                    metadata: { error },
                });
                return new AuthError('OAUTH_UNKNOWN_ERROR', 'Unknown OAuth error occurred', 500);
        }
    }

    /**
     * Generic error mapper for unknown errors
     */
    static fromUnknown(error: Error): DomainError {
        const errorName = error.name.toLowerCase();
        const errorMessage = error.message.toLowerCase();

        // Prisma errors
        if (errorName.includes('prisma') || errorMessage.includes('prisma')) {
            return this.fromPrisma(error as PrismaError);
        }

        // JWT errors
        if (
            errorName.includes('jwt') ||
            errorName.includes('token') ||
            errorMessage.includes('token')
        ) {
            return this.fromJWT(error as JWTError);
        }

        // Redis errors
        if (errorName.includes('redis') || errorMessage.includes('redis')) {
            return this.fromRedis(error as RedisError);
        }

        // Network errors
        if (
            errorName.includes('network') ||
            errorName.includes('timeout') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('econnrefused') ||
            errorMessage.includes('enotfound')
        ) {
            return this.fromNetwork(error);
        }

        // Validation errors
        if (errorName.includes('validation') || errorMessage.includes('validation')) {
            return new ValidationError('VALIDATION_FAILED', error.message, 400);
        }

        // Default to internal server error
        logger.error(`Unknown error type: ${errorName}`, {
            metadata: { message: error.message, stack: error.stack },
        });

        return InfrastructureError.EXTERNAL_SERVICE_ERROR;
    }

    /**
     * Map HTTP error code to domain error
     */
    static fromStatusCode(statusCode: number, message?: string): DomainError {
        switch (statusCode) {
            case 400:
                return new ValidationError('BAD_REQUEST', message || 'Bad request', 400);
            case 401:
                return AuthError.UNAUTHORIZED;
            case 403:
                return AuthError.FORBIDDEN;
            case 404:
                return UserError.NOT_FOUND;
            case 409:
                return new ValidationError('CONFLICT', message || 'Resource conflict', 409);
            case 429:
                return RateLimitError.TOO_MANY_REQUESTS;
            case 500:
                return InfrastructureError.DATABASE_ERROR;
            case 503:
                return InfrastructureError.EXTERNAL_SERVICE_ERROR;
            default:
                logger.warn(`Unknown status code mapped: ${statusCode}`);
                return new InfrastructureError(
                    'UNKNOWN_ERROR',
                    message || 'Unknown error occurred',
                    statusCode,
                );
        }
    }

    /**
     * Safely extract domain error from any error
     */
    static toDomain(error: Error | DomainError): DomainError {
        if (error instanceof DomainError) {
            return error;
        }

        return this.fromUnknown(error);
    }

    /**
     * Check if error is a specific domain error type
     */
    static isErrorType<T extends DomainError>(
        error: Error,
        ErrorClass: new (...args: any[]) => T,
    ): error is T {
        return error instanceof ErrorClass;
    }

    /**
     * Get error code from any error
     */
    static getErrorCode(error: Error): string {
        if (error instanceof DomainError) {
            return error.code;
        }

        const mapped = this.toDomain(error);
        return mapped.code;
    }

    /**
     * Get status code from any error
     */
    static getStatusCode(error: Error): number {
        if (error instanceof DomainError) {
            return error.statusCode;
        }

        const mapped = this.toDomain(error);
        return mapped.statusCode;
    }
}
