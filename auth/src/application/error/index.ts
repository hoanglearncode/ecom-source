/**
 * Application Error Module Index
 * Export all error-related use cases and types
 */

export {
    ErrorHandlerUseCase,
    ErrorHandlerResponse,
    ErrorContext,
} from './error-handler.use-case.js';

export { AuthErrorHandlerUseCase, AuthErrorHandlerResponse } from './auth-error.handler.js';

export { ErrorMapper } from './error-mapper.js';

export {
    ErrorCategory,
    getErrorCategory,
    isRetryable,
    isDomainErrorRetryable,
    getUserFriendlyMessage,
    isInCategory,
    getCodesByCategory,
    requiresUserAction,
    getSuggestedAction,
    getRetryAfterSeconds,
} from './error-codes.js';
