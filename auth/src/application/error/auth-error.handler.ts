/**
 * Authentication Error Handler
 * Specialized error handling for authentication operations
 */

import { injectable } from 'inversify';
import {
    AuthError,
    UserError,
    TokenError,
    TwoFactorError,
    VerificationError,
    DomainError,
} from '../../domain/domain-error/index.js';
import {
    ErrorHandlerUseCase,
    ErrorContext,
    ErrorHandlerResponse,
} from './error-handler.use-case.js';
import { getSuggestedAction, getRetryAfterSeconds } from './error-codes.js';

// ============================================================
// Auth Error Handler Response
// ============================================================

export interface AuthErrorHandlerResponse extends ErrorHandlerResponse {
    error: ErrorHandlerResponse['error'] & {
        authAction?: string;
        requiresAction?:
            'login' | 'refresh' | 'verify_email' | 'enable_2fa' | 'contact_support' | 'retry';
        retryAfter?: number; // seconds
    };
}

// ============================================================
// Auth Error Handler Use Case
// ============================================================

@injectable()
export class AuthErrorHandlerUseCase extends ErrorHandlerUseCase {
    /**
     * Handle authentication-specific errors
     */
    handleAuthError(error: Error, context?: ErrorContext): AuthErrorHandlerResponse {
        const baseResponse = this.handleError(error, context);

        const authResponse: AuthErrorHandlerResponse = {
            ...baseResponse,
            error: {
                ...baseResponse.error,
                authAction: context?.action,
                requiresAction: getSuggestedAction((error as DomainError).code as any),
                retryAfter: getRetryAfterSeconds((error as DomainError).code as any),
            },
        };

        return authResponse;
    }

    // ============================================================
    // Specialized handlers for specific auth operations
    // ============================================================

    handleLoginError(error: Error, context?: ErrorContext): AuthErrorHandlerResponse {
        return this.handleAuthError(error, { ...context, action: 'login' });
    }

    handleRegistrationError(error: Error, context?: ErrorContext): AuthErrorHandlerResponse {
        return this.handleAuthError(error, { ...context, action: 'register' });
    }

    handleRefreshError(error: Error, context?: ErrorContext): AuthErrorHandlerResponse {
        return this.handleAuthError(error, { ...context, action: 'refresh' });
    }

    handleLogoutError(error: Error, context?: ErrorContext): AuthErrorHandlerResponse {
        return this.handleAuthError(error, { ...context, action: 'logout' });
    }

    handleTwoFactorError(error: Error, context?: ErrorContext): AuthErrorHandlerResponse {
        return this.handleAuthError(error, { ...context, action: '2fa' });
    }

    handleVerificationError(error: Error, context?: ErrorContext): AuthErrorHandlerResponse {
        return this.handleAuthError(error, { ...context, action: 'verify' });
    }

    handlePasswordResetError(error: Error, context?: ErrorContext): AuthErrorHandlerResponse {
        return this.handleAuthError(error, { ...context, action: 'password_reset' });
    }

    handlePasswordChangeError(error: Error, context?: ErrorContext): AuthErrorHandlerResponse {
        return this.handleAuthError(error, { ...context, action: 'password_change' });
    }
}
