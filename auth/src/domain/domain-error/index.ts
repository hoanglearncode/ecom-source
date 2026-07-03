/**
 * Domain Error Index
 * Export all domain errors
 */

export {
    // Error classes
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
    // Error collection
    DomainErrors,
    // Error codes
    ERROR_CODES,
    type ErrorCode,
} from './error.js';
