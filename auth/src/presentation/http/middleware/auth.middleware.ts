/**
 * Authentication Middleware
 * Handles JWT token validation and API key authentication
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../../domain/entity/index.js';

// ============================================================
// Types
// ============================================================

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
        role: UserRole;
        status: string;
        jti: string;
    };
    apiKeyId?: string;
}

export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
}

// ============================================================
// JWT Token Helpers
// ============================================================

/**
 * Extract token from Authorization header
 * Format: "Bearer <token>"
 */
export const getTokenFromRequest = (req: Request): string | null => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return null;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1] || null;
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): any => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        return decoded;
    } catch (error) {
        return null;
    }
};

/**
 * Extract API Key from X-Api-Key header
 */
export const getApiKeyFromRequest = (req: Request): string | null => {
    const apiKey = req.headers['x-api-key'];
    if (Array.isArray(apiKey)) {
        return apiKey[0] || null;
    }
    return apiKey || null;
};

// ============================================================
// Middleware Functions
// ============================================================

/**
 * Bearer Token Authentication Middleware
 * Validates JWT access token and adds user to request
 */
export const authenticateBearer = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const token = getTokenFromRequest(req);

            if (!token) {
            return;
        }

        // TODO: Implement full token validation
        // 1. Verify JWT signature
        // 2. Check if token is blacklisted (using cache)
        // 3. Get user info from token claims
        // 4. Verify user still exists and is active
        // 5. Add user to request

        const decoded = verifyToken(token);
        if (!decoded) {
            return;
        }

        req.user = {
            id: decoded.sub || '',
            username: decoded.username || '',
            email: decoded.email || '',
            role: decoded.role || UserRole.USER,
            status: decoded.status || 'ACTIVE',
            jti: decoded.jti || '',
        };

        next();
    } catch (error) {
    }
};

/**
 * API Key Authentication Middleware
 * Validates API Key for internal/service-to-service calls
 */
export const authenticateApiKey = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const apiKey = getApiKeyFromRequest(req);

        if (!apiKey) {
            return;
        }

        // TODO: Implement full API key validation
        // 1. Lookup API key in database
        // 2. Check if key is active
        // 3. Check if key has expired
        // 4. Check IP whitelist if configured
        // 5. Check rate limits
        // 6. Add key info to request

        next();
    } catch (error) {
    }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role
 */
export const requireRole =
    (...allowedRoles: UserRole[]) =>
    (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            return;
        }

        if (!allowedRoles.includes(req.user.role as UserRole)) {
            return;
        }

        next();
    };

/**
 * Admin-only Middleware
 * Shortcut for requiring ADMIN or STAFF role
 */
export const requireAdmin = requireRole(UserRole.ADMIN, UserRole.STAFF);

/**
 * Optional Authentication Middleware
 * Attaches user if token present, but doesn't require it
 */
export const optionalAuthenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const token = getTokenFromRequest(req);

        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                req.user = {
                    id: decoded.sub || '',
                    username: decoded.username || '',
                    email: decoded.email || '',
                    role: decoded.role || UserRole.USER,
                    status: decoded.status || 'ACTIVE',
                    jti: decoded.jti || '',
                };
            }
        }

        next();
    } catch (error) {
        // Continue without authentication on error
        next();
    }
};

/**
 * Add user info to request (helper function)
 */
export const addUserToRequest = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
    user: any,
): void => {
    req.user = user;
    next();
};

// ============================================================
// Rate Limiting Headers Middleware
// ============================================================

/**
 * Add rate limit headers to response
 */
export const addRateLimitHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // TODO: Implement rate limiting
    // 1. Check rate limit for user/IP
    // 2. Add headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
    // 3. If exceeded, return 429

    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', '99');
    res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 3600);
    next();
};

// ============================================================
// Legacy Functions (for backward compatibility)
// ============================================================

/** @deprecated Use authenticateBearer instead */
export const checkToken = (req: any, res: any, next: any) => {
    authenticateBearer(req, res, next);
};

/** @deprecated Use getTokenFromRequest instead */
export const getTokenFormRequest = getTokenFromRequest;

/** @deprecated Use requireRole instead */
export const validateRole = (req: any, res: any, next: any, role: string) => {
    if (!req.user || req.user.role !== role) {
        return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
};
