/**
 * Error Handler Use Case
 * Maps domain errors to appropriate application responses
 * Provides error translation between domain and presentation layers
 */

import { injectable } from 'inversify';
import {
    DomainError,
    UserError,
    AuthError,
    TokenError,
    TwoFactorError,
    VerificationError,
    RateLimitError,
    OAuthError,
    ValidationError,
    InfrastructureError,
} from '../../domain/domain-error/index.js';
import { logger } from '../../shared/logger/index.js';
import {
    getUserFriendlyMessage,
    isDomainErrorRetryable,
    getSuggestedAction,
    getRetryAfterSeconds,
} from './error-codes.js';

// ============================================================
// Error Handler Response Types
// ============================================================

export interface ErrorHandlerResponse {
    success: false;
    error: {
        code: string;
        message: string;
        statusCode: number;
        isRetryable: boolean;
        userMessage?: string;
        technicalDetails?: string;
    };
}

export interface ErrorContext {
    userId?: string;
    requestId?: string;
    action?: string;
    resource?: string;
    metadata?: Record<string, any>;
}

// ============================================================
// Error Handler Use Case
// ============================================================

@injectable()
export class ErrorHandlerUseCase {
    /**
     * Handle domain errors and map to appropriate response
     */
    handleError(error: Error, context?: ErrorContext): ErrorHandlerResponse {
        // Log error with context
        this.logError(error, context);

        // Handle domain errors
        if (error instanceof DomainError) {
            return this.handleDomainError(error, context);
        }

        // Handle unexpected errors
        return this.handleUnexpectedError(error, context);
    }

    /**
     * Handle specific domain errors
     */
    private handleDomainError(error: DomainError, context?: ErrorContext): ErrorHandlerResponse {
        const userMessage = getUserFriendlyMessage(error.code as any, error.message);

        return {
            success: false,
            error: {
                code: error.code,
                message: error.message,
                statusCode: error.statusCode,
                isRetryable: isDomainErrorRetryable(error),
                userMessage,
                technicalDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
        };
    }

    /**
     * Handle unexpected errors
     */
    private handleUnexpectedError(error: Error, context?: ErrorContext): ErrorHandlerResponse {
        const isDevelopment = process.env.NODE_ENV === 'development';

        return {
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: isDevelopment
                    ? error.message
                    : 'An unexpected error occurred. Please try again later.',
                statusCode: 500,
                isRetryable: true,
                userMessage: 'Something went wrong. Please try again.',
                technicalDetails: isDevelopment ? error.stack : undefined,
            },
        };
    }

    /**
     * Log error with context
     */
    private logError(error: Error, context?: ErrorContext): void {
        const logContext = {
            requestId: context?.requestId,
            userId: context?.userId,
            action: context?.action,
            resource: context?.resource,
            errorCode: error instanceof DomainError ? error.code : 'UNKNOWN',
            errorType: error instanceof DomainError ? error.name : 'Error',
        };

        if (error instanceof DomainError) {
            // Domain errors are business logic errors - log as warnings
            logger.warn(`Domain Error: ${error.message}`, {
                context: logContext,
                metadata: {
                    ...context?.metadata,
                    domainError: error.code,
                    statusCode: error.statusCode,
                },
            });
        } else {
            // Unexpected errors - log as errors
            logger.error(`Unexpected Error: ${error.message}`, {
                context: logContext,
                metadata: {
                    ...context?.metadata,
                    stack: error.stack,
                    name: error.name,
                },
            });
        }
    }

    // ============================================================
    // Type Guards (Convenience methods)
    // ============================================================

    isUserError(error: Error): error is UserError {
        return error instanceof UserError;
    }

    isAuthError(error: Error): error is AuthError {
        return error instanceof AuthError;
    }

    isTokenError(error: Error): error is TokenError {
        return error instanceof TokenError;
    }

    isTwoFactorError(error: Error): error is TwoFactorError {
        return error instanceof TwoFactorError;
    }

    isVerificationError(error: Error): error is VerificationError {
        return error instanceof VerificationError;
    }

    isRateLimitError(error: Error): error is RateLimitError {
        return error instanceof RateLimitError;
    }

    isOAuthError(error: Error): error is OAuthError {
        return error instanceof OAuthError;
    }

    isValidationError(error: Error): error is ValidationError {
        return error instanceof ValidationError;
    }

    isInfrastructureError(error: Error): error is InfrastructureError {
        return error instanceof InfrastructureError;
    }

    /**
     * Get safe error details for client response
     * Filters out sensitive information in production
     */
    getSafeErrorDetails(error: Error, context?: ErrorContext): ErrorHandlerResponse['error'] {
        const response = this.handleError(error, context).error;

        // Remove technical details in production
        if (process.env.NODE_ENV === 'production') {
            delete response.technicalDetails;
        }

        return response;
    }
}
