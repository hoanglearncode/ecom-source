/**
 * Domain Errors - Business Rule Violations
 * These are NOT HTTP errors - they will be mapped in outer layers (application/presentation)
 *
 * Error code convention: {ENTITY}_{ACTION}_{REASON}
 */

// ============================================================
// Base Domain Error
// ============================================================

export class DomainError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = 'DomainError';
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
        };
    }
}

// ============================================================
// User Errors
// ============================================================

export class UserError extends DomainError {
    constructor(code: string, message: string, statusCode: number = 400) {
        super(code, message, statusCode);
        this.name = 'UserError';
    }

    // Username errors
    static INVALID_USERNAME = new UserError(
        'USER_INVALID_USERNAME',
        'Username must be 3-50 alphanumeric characters (letters, numbers, underscore only)',
        400,
    );

    static USERNAME_TOO_SHORT = new UserError(
        'USER_USERNAME_TOO_SHORT',
        'Username must be at least 3 characters',
        400,
    );

    static USERNAME_TOO_LONG = new UserError(
        'USER_USERNAME_TOO_LONG',
        'Username must not exceed 50 characters',
        400,
    );

    static USERNAME_INVALID_FORMAT = new UserError(
        'USER_USERNAME_INVALID_FORMAT',
        'Username can only contain letters, numbers, and underscores',
        400,
    );

    static USERNAME_EXISTS = new UserError(
        'USER_USERNAME_EXISTS',
        'Username is already taken',
        409,
    );

    // Email errors
    static INVALID_EMAIL = new UserError('USER_INVALID_EMAIL', 'Invalid email format', 400);

    static EMAIL_EXISTS = new UserError('USER_EMAIL_EXISTS', 'Email is already registered', 409);

    // Phone errors
    static INVALID_PHONE = new UserError('USER_INVALID_PHONE', 'Invalid phone number format', 400);

    static PHONE_EXISTS = new UserError(
        'USER_PHONE_EXISTS',
        'Phone number is already registered',
        409,
    );

    // Account status errors
    static ACCOUNT_BANNED = new UserError(
        'USER_ACCOUNT_BANNED',
        'Account has been banned. Please contact support',
        403,
    );

    static ACCOUNT_DELETED = new UserError(
        'USER_ACCOUNT_DELETED',
        'Account has been permanently deleted',
        410,
    );

    static ACCOUNT_UNVERIFIED = new UserError(
        'USER_ACCOUNT_UNVERIFIED',
        'Account is not verified. Please verify your email',
        403,
    );

    static ACCOUNT_LOCKED = new UserError(
        'USER_ACCOUNT_LOCKED',
        'Account is temporarily locked due to multiple failed attempts',
        423,
    );

    static ACCOUNT_LOCKED_UNTIL = new UserError(
        'USER_ACCOUNT_LOCKED_UNTIL',
        'Account is locked. Try again later',
        423,
    );

    // User not found
    static NOT_FOUND = new UserError('USER_NOT_FOUND', 'User not found', 404);

    static NOT_FOUND_BY_EMAIL = new UserError(
        'USER_NOT_FOUND_BY_EMAIL',
        'No account found with this email',
        404,
    );

    static NOT_FOUND_BY_PHONE = new UserError(
        'USER_NOT_FOUND_BY_PHONE',
        'No account found with this phone number',
        404,
    );

    // Credentials errors
    static INVALID_CREDENTIALS = new UserError(
        'USER_INVALID_CREDENTIALS',
        'Invalid email or password',
        401,
    );

    static INVALID_PASSWORD = new UserError('USER_INVALID_PASSWORD', 'Invalid password', 401);

    // Password errors
    static PASSWORD_TOO_WEAK = new UserError(
        'USER_PASSWORD_TOO_WEAK',
        'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
        400,
    );

    static PASSWORD_MISMATCH = new UserError(
        'USER_PASSWORD_MISMATCH',
        'Passwords do not match',
        400,
    );

    static PASSWORD_SAME_AS_OLD = new UserError(
        'USER_PASSWORD_SAME_AS_OLD',
        'New password must be different from current password',
        400,
    );

    static PASSWORD_RECENTLY_USED = new UserError(
        'USER_PASSWORD_RECENTLY_USED',
        'Password was recently used. Please choose a different one',
        400,
    );

    static PASSWORD_HISTORY_LIMIT = new UserError(
        'USER_PASSWORD_HISTORY_LIMIT',
        'Cannot reuse last 5 passwords',
        400,
    );
}

// ============================================================
// Authentication Errors
// ============================================================

export class AuthError extends DomainError {
    constructor(code: string, message: string, statusCode: number = 401) {
        super(code, message, statusCode);
        this.name = 'AuthError';
    }

    static UNAUTHORIZED = new AuthError('AUTH_UNAUTHORIZED', 'Authentication required', 401);

    static INVALID_TOKEN = new AuthError('AUTH_INVALID_TOKEN', 'Invalid authentication token', 401);

    static EXPIRED_TOKEN = new AuthError(
        'AUTH_EXPIRED_TOKEN',
        'Authentication token has expired',
        401,
    );

    static MALFORMED_TOKEN = new AuthError(
        'AUTH_MALFORMED_TOKEN',
        'Malformed authentication token',
        401,
    );

    static TOKEN_REVOKED = new AuthError('AUTH_TOKEN_REVOKED', 'Token has been revoked', 401);

    static BLACKLISTED_TOKEN = new AuthError('AUTH_BLACKLISTED_TOKEN', 'Token is blacklisted', 401);

    static INSUFFICIENT_PERMISSIONS = new AuthError(
        'AUTH_INSUFFICIENT_PERMISSIONS',
        'Insufficient permissions to access this resource',
        403,
    );

    static FORBIDDEN = new AuthError('AUTH_FORBIDDEN', 'Access to this resource is forbidden', 403);

    static SESSION_EXPIRED = new AuthError(
        'AUTH_SESSION_EXPIRED',
        'Session has expired. Please login again',
        401,
    );

    static LOGIN_REQUIRED = new AuthError(
        'AUTH_LOGIN_REQUIRED',
        'You must login to access this resource',
        401,
    );
}

// ============================================================
// Token Errors
// ============================================================

export class TokenError extends DomainError {
    constructor(code: string, message: string, statusCode: number = 400) {
        super(code, message, statusCode);
        this.name = 'TokenError';
    }

    static INVALID_REFRESH_TOKEN = new TokenError(
        'TOKEN_INVALID_REFRESH',
        'Invalid refresh token',
        401,
    );

    static EXPIRED_REFRESH_TOKEN = new TokenError(
        'TOKEN_EXPIRED_REFRESH',
        'Refresh token has expired',
        401,
    );

    static REFRESH_TOKEN_REVOKED = new TokenError(
        'TOKEN_REFRESH_REVOKED',
        'Refresh token has been revoked',
        401,
    );

    static REFRESH_TOKEN_NOT_FOUND = new TokenError(
        'TOKEN_REFRESH_NOT_FOUND',
        'Refresh token not found',
        404,
    );

    static TOKEN_GENERATION_FAILED = new TokenError(
        'TOKEN_GENERATION_FAILED',
        'Failed to generate authentication token',
        500,
    );

    static TOO_MANY_TOKENS = new TokenError(
        'TOKEN_TOO_MANY',
        'Maximum number of active tokens reached',
        429,
    );
}

// ============================================================
// Two-Factor Authentication Errors
// ============================================================

export class TwoFactorError extends DomainError {
    constructor(code: string, message: string, statusCode: number = 400) {
        super(code, message, statusCode);
        this.name = 'TwoFactorError';
    }

    static NOT_ENABLED = new TwoFactorError(
        '2FA_NOT_ENABLED',
        'Two-factor authentication is not enabled for this account',
        400,
    );

    static ALREADY_ENABLED = new TwoFactorError(
        '2FA_ALREADY_ENABLED',
        'Two-factor authentication is already enabled',
        400,
    );

    static INVALID_CODE = new TwoFactorError('2FA_INVALID_CODE', 'Invalid verification code', 400);

    static EXCEEDED_ATTEMPTS = new TwoFactorError(
        '2FA_EXCEEDED_ATTEMPTS',
        'Too many incorrect attempts. Please try again later',
        429,
    );

    static BACKUP_CODE_USED = new TwoFactorError(
        '2FA_BACKUP_CODE_USED',
        'This backup code has already been used',
        400,
    );

    static NO_BACKUP_CODES = new TwoFactorError(
        '2FA_NO_BACKUP_CODES',
        'No backup codes available',
        400,
    );

    static SECRET_NOT_VERIFIED = new TwoFactorError(
        '2FA_SECRET_NOT_VERIFIED',
        'Two-factor secret not verified',
        400,
    );

    static DISABLE_FAILED = new TwoFactorError(
        '2FA_DISABLE_FAILED',
        'Failed to disable two-factor authentication',
        400,
    );
}

// ============================================================
// Verification Errors
// ============================================================

export class VerificationError extends DomainError {
    constructor(code: string, message: string, statusCode: number = 400) {
        super(code, message, statusCode);
        this.name = 'VerificationError';
    }

    static INVALID_TOKEN = new VerificationError(
        'VERIFY_INVALID_TOKEN',
        'Invalid verification token',
        400,
    );

    static EXPIRED_TOKEN = new VerificationError(
        'VERIFY_EXPIRED_TOKEN',
        'Verification token has expired',
        400,
    );

    static TOKEN_USED = new VerificationError(
        'VERIFY_TOKEN_USED',
        'Verification token has already been used',
        400,
    );

    static TOO_MANY_ATTEMPTS = new VerificationError(
        'VERIFY_TOO_MANY_ATTEMPTS',
        'Too many verification attempts. Please request a new code',
        429,
    );

    static ALREADY_VERIFIED = new VerificationError(
        'VERIFY_ALREADY_VERIFIED',
        'Email has already been verified',
        400,
    );

    static NOT_FOUND = new VerificationError('VERIFY_NOT_FOUND', 'Verification not found', 404);
}

// ============================================================
// Rate Limit Errors
// ============================================================

export class RateLimitError extends DomainError {
    constructor(code: string, message: string, statusCode: number = 429) {
        super(code, message, statusCode);
        this.name = 'RateLimitError';
    }

    static TOO_MANY_REQUESTS = new RateLimitError(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests. Please try again later',
        429,
    );

    static TOO_MANY_LOGIN_ATTEMPTS = new RateLimitError(
        'RATE_LIMIT_LOGIN_ATTEMPTS',
        'Too many login attempts. Account temporarily locked',
        429,
    );

    static TOO_MANY_OTP_REQUESTS = new RateLimitError(
        'RATE_LIMIT_OTP_REQUESTS',
        'Too many OTP requests. Please wait before requesting another',
        429,
    );

    static IP_BLOCKED = new RateLimitError(
        'RATE_LIMIT_IP_BLOCKED',
        'Your IP address has been blocked due to suspicious activity',
        429,
    );
}

// ============================================================
// OAuth Errors
// ============================================================

export class OAuthError extends DomainError {
    constructor(code: string, message: string, statusCode: number = 400) {
        super(code, message, statusCode);
        this.name = 'OAuthError';
    }

    static PROVIDER_NOT_SUPPORTED = new OAuthError(
        'OAUTH_PROVIDER_NOT_SUPPORTED',
        'OAuth provider is not supported',
        400,
    );

    static ACCOUNT_ALREADY_LINKED = new OAuthError(
        'OAUTH_ALREADY_LINKED',
        'OAuth account is already linked to another user',
        409,
    );

    static ACCOUNT_NOT_FOUND = new OAuthError(
        'OAUTH_ACCOUNT_NOT_FOUND',
        'OAuth account not found',
        404,
    );

    static AUTH_CODE_INVALID = new OAuthError(
        'OAUTH_AUTH_CODE_INVALID',
        'Invalid authorization code',
        401,
    );

    static ACCESS_DENIED = new OAuthError('OAUTH_ACCESS_DENIED', 'Access denied by user', 403);
}

// ============================================================
// Validation Errors
// ============================================================

export class ValidationError extends DomainError {
    constructor(code: string, message: string, statusCode: number = 400) {
        super(code, message, statusCode);
        this.name = 'ValidationError';
    }

    static REQUIRED_FIELD = (field: string) =>
        new ValidationError(
            `VALIDATION_REQUIRED_${field.toUpperCase()}`,
            `${field} is required`,
            400,
        );

    static INVALID_FORMAT = (field: string) =>
        new ValidationError(
            `VALIDATION_INVALID_${field.toUpperCase()}`,
            `Invalid ${field} format`,
            400,
        );

    static INVALID_LENGTH = (field: string, min: number, max: number) =>
        new ValidationError(
            `VALIDATION_INVALID_LENGTH_${field.toUpperCase()}`,
            `${field} must be between ${min} and ${max} characters`,
            400,
        );

    static INVALID_VALUE = (field: string, expected: string) =>
        new ValidationError(
            `VALIDATION_INVALID_VALUE_${field.toUpperCase()}`,
            `Invalid ${field}. Expected: ${expected}`,
            400,
        );
}

// ============================================================
// Infrastructure Errors
// ============================================================

export class InfrastructureError extends DomainError {
    constructor(code: string, message: string, statusCode: number = 500) {
        super(code, message, statusCode);
        this.name = 'InfrastructureError';
    }

    static DATABASE_ERROR = new InfrastructureError(
        'INFRA_DATABASE_ERROR',
        'Database operation failed',
        500,
    );

    static CACHE_ERROR = new InfrastructureError(
        'INFRA_CACHE_ERROR',
        'Cache operation failed',
        500,
    );

    static EXTERNAL_SERVICE_ERROR = new InfrastructureError(
        'INFRA_EXTERNAL_SERVICE_ERROR',
        'External service error',
        503,
    );

    static MESSAGE_QUEUE_ERROR = new InfrastructureError(
        'INFRA_MESSAGE_QUEUE_ERROR',
        'Message queue operation failed',
        500,
    );
}

// ============================================================
// Export all error types
// ============================================================

export const DomainErrors = {
    UserError,
    AuthError,
    TokenError,
    TwoFactorError,
    VerificationError,
    RateLimitError,
    OAuthError,
    ValidationError,
    InfrastructureError,
};

// Error code constants for type safety
export const ERROR_CODES = {
    // User errors
    USER_INVALID_USERNAME: 'USER_INVALID_USERNAME',
    USER_INVALID_EMAIL: 'USER_INVALID_EMAIL',
    USER_INVALID_PHONE: 'USER_INVALID_PHONE',
    USER_ACCOUNT_BANNED: 'USER_ACCOUNT_BANNED',
    USER_ACCOUNT_DELETED: 'USER_ACCOUNT_DELETED',
    USER_ACCOUNT_UNVERIFIED: 'USER_ACCOUNT_UNVERIFIED',
    USER_ACCOUNT_LOCKED: 'USER_ACCOUNT_LOCKED',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_INVALID_CREDENTIALS: 'USER_INVALID_CREDENTIALS',
    USER_PASSWORD_TOO_WEAK: 'USER_PASSWORD_TOO_WEAK',
    USER_PASSWORD_MISMATCH: 'USER_PASSWORD_MISMATCH',

    // Auth errors
    AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
    AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
    AUTH_EXPIRED_TOKEN: 'AUTH_EXPIRED_TOKEN',
    AUTH_TOKEN_REVOKED: 'AUTH_TOKEN_REVOKED',
    AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',

    // Token errors
    TOKEN_INVALID_REFRESH: 'TOKEN_INVALID_REFRESH',
    TOKEN_EXPIRED_REFRESH: 'TOKEN_EXPIRED_REFRESH',
    TOKEN_REFRESH_REVOKED: 'TOKEN_REFRESH_REVOKED',

    // 2FA errors
    '2FA_NOT_ENABLED': '2FA_NOT_ENABLED',
    '2FA_ALREADY_ENABLED': '2FA_ALREADY_ENABLED',
    '2FA_INVALID_CODE': '2FA_INVALID_CODE',
    '2FA_EXCEEDED_ATTEMPTS': '2FA_EXCEEDED_ATTEMPTS',

    // Verification errors
    VERIFY_INVALID_TOKEN: 'VERIFY_INVALID_TOKEN',
    VERIFY_EXPIRED_TOKEN: 'VERIFY_EXPIRED_TOKEN',
    VERIFY_TOKEN_USED: 'VERIFY_TOKEN_USED',

    // Rate limit errors
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    RATE_LIMIT_IP_BLOCKED: 'RATE_LIMIT_IP_BLOCKED',

    // Validation errors
    VALIDATION_REQUIRED: 'VALIDATION_REQUIRED',
    VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',

    // Infrastructure errors
    INFRA_DATABASE_ERROR: 'INFRA_DATABASE_ERROR',
    INFRA_CACHE_ERROR: 'INFRA_CACHE_ERROR',
    INFRA_EXTERNAL_SERVICE_ERROR: 'INFRA_EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
