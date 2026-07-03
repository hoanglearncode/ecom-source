/**
 * Error Code Utilities
 * Helper functions for error classification and handling
 * Source of truth: domain/error.ts - this file only provides utilities
 */

import { DomainError, ERROR_CODES, type ErrorCode } from '../../domain/domain-error/index.js';

// ============================================================
// Error Code Categories
// ============================================================

export enum ErrorCategory {
    USER = 'USER',
    AUTH = 'AUTH',
    TOKEN = 'TOKEN',
    TWO_FACTOR = '2FA',
    VERIFICATION = 'VERIFY',
    RATE_LIMIT = 'RATE_LIMIT',
    OAUTH = 'OAUTH',
    VALIDATION = 'VALIDATION',
    INFRASTRUCTURE = 'INFRA',
    GENERAL = 'GENERAL',
}

// ============================================================
// Category Mappings (by error code prefix)
// ============================================================

const ERROR_CODE_PREFIXES: Record<string, ErrorCategory> = {
    USER: ErrorCategory.USER,
    AUTH: ErrorCategory.AUTH,
    TOKEN: ErrorCategory.TOKEN,
    '2FA': ErrorCategory.TWO_FACTOR,
    VERIFY: ErrorCategory.VERIFICATION,
    RATE_LIMIT: ErrorCategory.RATE_LIMIT,
    OAUTH: ErrorCategory.OAUTH,
    VALIDATION: ErrorCategory.VALIDATION,
    INFRA: ErrorCategory.INFRASTRUCTURE,
};

// ============================================================
// Retryable Error Codes
// ============================================================

const RETRYABLE_ERROR_CODES: Set<ErrorCode> = new Set([
    'RATE_LIMIT_EXCEEDED',
    'RATE_LIMIT_LOGIN_ATTEMPTS',
    'RATE_LIMIT_OTP_REQUESTS',
    'RATE_LIMIT_IP_BLOCKED',
    'INFRA_DATABASE_ERROR',
    'INFRA_CACHE_ERROR',
    'INFRA_EXTERNAL_SERVICE_ERROR',
    'INFRA_MESSAGE_QUEUE_ERROR',
    'TOKEN_GENERATION_FAILED',
]);

// ============================================================
// User-Friendly Messages Map
// ============================================================

const USER_FRIENDLY_MESSAGES: Partial<Record<ErrorCode, string>> = {
    // Account status messages
    USER_ACCOUNT_LOCKED:
        'Your account has been temporarily locked due to multiple failed login attempts. Please try again later or reset your password.',
    USER_ACCOUNT_BANNED:
        'Your account has been banned. If you believe this is an error, please contact our support team.',
    USER_PASSWORD_TOO_WEAK:
        'Please choose a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.',
    USER_ACCOUNT_DELETED: 'This account has been permanently deleted.',

    // Auth messages
    AUTH_EXPIRED_TOKEN: 'Your session has expired. Please log in again.',
    AUTH_SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    AUTH_INVALID_TOKEN: 'Invalid authentication. Please log in again.',
    AUTH_MALFORMED_TOKEN: 'Invalid authentication. Please log in again.',
    AUTH_BLACKLISTED_TOKEN: 'Invalid authentication. Please log in again.',
    AUTH_TOKEN_REVOKED: 'Invalid authentication. Please log in again.',
    AUTH_UNAUTHORIZED: 'Authentication required. Please log in.',
    AUTH_LOGIN_REQUIRED: 'You must login to access this resource.',
    AUTH_FORBIDDEN: "You don't have permission to perform this action.",

    // Token messages
    TOKEN_INVALID_REFRESH: 'Your refresh token is invalid or expired. Please log in again.',
    TOKEN_EXPIRED_REFRESH: 'Your refresh token has expired. Please log in again.',
    TOKEN_REFRESH_REVOKED: 'Your refresh token has been revoked. Please log in again.',
    TOKEN_REFRESH_NOT_FOUND: 'Refresh token not found. Please log in again.',
    TOKEN_TOO_MANY: 'You have too many active sessions. Please log out from some devices first.',

    // 2FA messages
    '2FA_NOT_ENABLED': 'Two-factor authentication is not enabled for your account.',
    '2FA_ALREADY_ENABLED': 'Two-factor authentication is already enabled.',
    '2FA_INVALID_CODE': 'Invalid verification code. Please try again.',
    '2FA_EXCEEDED_ATTEMPTS':
        'Too many incorrect 2FA attempts. For security reasons, please wait a few minutes before trying again.',
    '2FA_BACKUP_CODE_USED': 'This backup code has already been used.',
    '2FA_NO_BACKUP_CODES': 'No backup codes available. Please generate new ones.',
    '2FA_SECRET_NOT_VERIFIED':
        'Two-factor authentication setup not completed. Please verify your secret.',
    '2FA_DISABLE_FAILED': 'Failed to disable two-factor authentication. Please try again.',

    // Verification messages
    VERIFY_INVALID_TOKEN: 'Invalid verification token. Please request a new one.',
    VERIFY_EXPIRED_TOKEN: 'Verification token has expired. Please request a new one.',
    VERIFY_TOKEN_USED: 'This verification token has already been used.',
    VERIFY_TOO_MANY_ATTEMPTS: 'Too many verification attempts. Please request a new code.',
    VERIFY_ALREADY_VERIFIED: 'Email has already been verified.',
    VERIFY_NOT_FOUND: 'Verification not found. Please request a new verification code.',

    // Rate limit messages
    RATE_LIMIT_EXCEEDED: "You've made too many requests. Please wait a moment before trying again.",
    RATE_LIMIT_LOGIN_ATTEMPTS: 'Too many login attempts. Account temporarily locked.',
    RATE_LIMIT_OTP_REQUESTS: 'Too many OTP requests. Please wait before requesting another.',
    RATE_LIMIT_IP_BLOCKED: 'Your IP address has been blocked due to suspicious activity.',
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get error category by error code
 */
export function getErrorCategory(code: ErrorCode): ErrorCategory | undefined {
    const prefix = code.split('_')[0];
    return ERROR_CODE_PREFIXES[prefix];
}

/**
 * Check if error code is retryable
 */
export function isRetryable(code: ErrorCode): boolean {
    return RETRYABLE_ERROR_CODES.has(code);
}

/**
 * Check if error is retryable (by DomainError instance)
 */
export function isDomainErrorRetryable(error: DomainError): boolean {
    return isRetryable(error.code as ErrorCode);
}

/**
 * Get user-friendly message for error code
 */
export function getUserFriendlyMessage(
    code: ErrorCode,
    defaultMessage?: string,
): string | undefined {
    return USER_FRIENDLY_MESSAGES[code] || defaultMessage;
}

/**
 * Check if error code belongs to a category
 */
export function isInCategory(code: ErrorCode, category: ErrorCategory): boolean {
    return getErrorCategory(code) === category;
}

/**
 * Get all error codes for a category
 */
export function getCodesByCategory(category: ErrorCategory): ErrorCode[] {
    return Object.values(ERROR_CODES).filter((code) => getErrorCategory(code) === category);
}

/**
 * Check if error requires user action
 */
export function requiresUserAction(code: ErrorCode): boolean {
    const actionRequiredCodes: ErrorCode[] = [
        'USER_ACCOUNT_UNVERIFIED',
        'USER_ACCOUNT_LOCKED',
        'USER_ACCOUNT_BANNED',
        '2FA_NOT_ENABLED',
        'VERIFY_EXPIRED_TOKEN',
    ];
    return actionRequiredCodes.includes(code);
}

/**
 * Get suggested action for error
 */
export function getSuggestedAction(
    code: ErrorCode,
): 'login' | 'refresh' | 'verify_email' | 'enable_2fa' | 'contact_support' | 'retry' | undefined {
    const actionMap: Partial<
        Record<
            ErrorCode,
            'login' | 'refresh' | 'verify_email' | 'enable_2fa' | 'contact_support' | 'retry'
        >
    > = {
        // Token errors
        AUTH_EXPIRED_TOKEN: 'login',
        AUTH_SESSION_EXPIRED: 'login',
        AUTH_INVALID_TOKEN: 'login',
        AUTH_MALFORMED_TOKEN: 'login',
        AUTH_BLACKLISTED_TOKEN: 'login',
        AUTH_TOKEN_REVOKED: 'login',
        AUTH_UNAUTHORIZED: 'login',
        AUTH_LOGIN_REQUIRED: 'login',

        // Refresh token errors
        TOKEN_INVALID_REFRESH: 'login',
        TOKEN_EXPIRED_REFRESH: 'login',
        TOKEN_REFRESH_REVOKED: 'login',
        TOKEN_REFRESH_NOT_FOUND: 'login',

        // Account status
        USER_ACCOUNT_UNVERIFIED: 'verify_email',
        USER_ACCOUNT_LOCKED: 'contact_support',
        USER_ACCOUNT_BANNED: 'contact_support',
        USER_ACCOUNT_DELETED: 'contact_support',

        // 2FA
        '2FA_NOT_ENABLED': 'enable_2fa',

        // Retryable errors
        RATE_LIMIT_EXCEEDED: 'retry',
        INFRA_DATABASE_ERROR: 'retry',
        INFRA_CACHE_ERROR: 'retry',
        INFRA_EXTERNAL_SERVICE_ERROR: 'retry',
    };

    return actionMap[code];
}

/**
 * Get retry-after duration in seconds (if applicable)
 */
export function getRetryAfterSeconds(code: ErrorCode): number | undefined {
    const retryAfterMap: Partial<Record<ErrorCode, number>> = {
        RATE_LIMIT_EXCEEDED: 60,
        RATE_LIMIT_LOGIN_ATTEMPTS: 900, // 15 minutes
        RATE_LIMIT_OTP_REQUESTS: 300, // 5 minutes
        '2FA_EXCEEDED_ATTEMPTS': 300, // 5 minutes
        VERIFY_TOO_MANY_ATTEMPTS: 300, // 5 minutes
        TOKEN_TOO_MANY: 3600, // 1 hour
    };

    return retryAfterMap[code];
}
