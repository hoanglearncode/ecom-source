/**
 * Internal Controller
 * Handles internal API calls from other microservices
 * Protected by API Key authentication
 *
 * Routes:
 * - POST   /internal/validate-token        - Validate JWT token
 * - GET    /internal/user/:user_id         - Get user info
 * - POST   /internal/check-permission      - Check user permission
 */

import express, { Request, Response, NextFunction } from 'express';

const buildInternalController = (): express.Router => {
    const router = express.Router();

    // ============================================================
    // POST /internal/validate-token
    // ============================================================
    router.post('/validate-token', async (req: Request, res: Response, next: NextFunction) => {
        try {

            // TODO: Implement token validation use case
            // 1. Verify API key from X-Api-Key header (middleware)
            // 2. Verify JWT token signature
            // 3. Check if token is blacklisted
            // 4. Extract user_id, role, status, jti
            // 5. Return ValidateTokenResponse
        } catch (error) {
            next(error);
        }
    });

    // ============================================================
    // GET /internal/user/:user_id
    // ============================================================
    router.get('/user/:user_id', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { user_id } = req.params;

            // TODO: Implement get user info use case
            // 1. Verify API key from X-Api-Key header (middleware)
            // 2. Find user by ID
            // 3. Return safe user info (no password hash)
            // 4. Return InternalUserInfo
        } catch (error) {
            next(error);
        }
    });

    // ============================================================
    // POST /internal/check-permission
    // ============================================================
    router.post('/check-permission', async (req: Request, res: Response, next: NextFunction) => {
        try {
            // TODO: Implement check permission use case
            // 1. Verify API key from X-Api-Key header (middleware)
            // 2. Find user by user_id
            // 3. Check RBAC permissions
            // 4. Determine if action is allowed for user's role
            // 5. Return CheckPermissionResponse
        } catch (error) {
            next(error);
        }
    });

    return router;
};

export { buildInternalController };
