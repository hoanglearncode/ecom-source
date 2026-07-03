/**
 * HTTP Middleware Index
 * Exports all middleware for the presentation layer
 */

// ============================================================
// Authentication & Authorization Middleware
// ============================================================

export {
    authenticateBearer,
    authenticateApiKey,
    requireRole,
    requireAdmin,
    optionalAuthenticate,
    addUserToRequest,
    type AuthenticatedRequest,
    type RateLimitInfo,
} from './auth.middleware.js';

// ============================================================
// Token & API Key Helpers
// ============================================================

export {
    getTokenFromRequest,
    getApiKeyFromRequest,
    verifyToken,
} from './auth.middleware.js';

// ============================================================
// Rate Limiting Middleware
// ============================================================

export {
    addRateLimitHeaders,
} from './auth.middleware.js';

// ============================================================
// Error Handling Middleware
// ============================================================

export {
    errorHandler,
    notFoundHandler,
    validationErrorHandler,
    asyncHandler,
    OperationalError,
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    RateLimitError,
    ServiceUnavailableError,
} from './error-handler.middleware.js';

// ============================================================
// Legacy Functions (for backward compatibility)
// ============================================================

export {
    checkToken,
    getTokenFormRequest,
    validateRole,
} from './auth.middleware.js';
