/**
 * Token Controller
 * Handles token management: refresh, revoke, introspect
 *
 * Routes:
 * - POST   /token/refresh           - Refresh access token
 * - POST   /token/revoke            - Revoke a refresh token
 * - POST   /token/introspect        - Check token validity (internal)
 */

import express, { Request, Response, NextFunction } from 'express';

const buildTokenController = (): express.Router => {
    const router = express.Router();

    // ============================================================
    // POST /token/refresh
    // ============================================================
    router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
        try {

            // TODO: Implement refresh token use case
            // 1. Verify refresh token signature
            // 2. Check if token is blacklisted
            // 3. Check if token session exists
            // 4. Generate new access + refresh tokens (rotation)
            // 5. Add old refresh token to blacklist
            // 6. Update session with new tokens
            // 7. Return TokenPair
        } catch (error) {
            next(error);
        }
    });

    // ============================================================
    // POST /token/revoke
    // ============================================================
    router.post('/revoke', async (req: Request, res: Response, next: NextFunction) => {
        try {
            // TODO: Implement token revocation use case
            // 1. Get user from current access token
            // 2. Verify the refresh token to revoke
            // 3. Check ownership (user can only revoke their own tokens)
            // 4. Add refresh token JTI to blacklist
            // 5. Delete associated session
            // 6. Return 204


        } catch (error) {
            next(error);
        }
    });

    // ============================================================
    // POST /token/introspect
    // ============================================================
    router.post('/introspect', async (req: Request, res: Response, next: NextFunction) => {
        try {

            // TODO: Implement token introspection use case
            // 1. Verify token signature
            // 2. Check if token is blacklisted
            // 3. Extract user_id, role, jti, exp, iat
            // 4. Return TokenIntrospectResponse
        } catch (error) {
            next(error);
        }
    });

    return router;
};

export { buildTokenController };
