/**
 * Session Controller
 * Handles user session and device management
 *
 * Routes:
 * - GET    /sessions                - List all active sessions
 * - DELETE /sessions/:session_id    - Revoke a specific session
 */

import express, { Request, Response, NextFunction } from 'express';

const buildSessionController = (): express.Router => {
    const router = express.Router();

    // ============================================================
    // GET /sessions
    // ============================================================
    router.get('/', async (req: Request, res: Response, next: NextFunction) => {
        try {
            // TODO: Implement list sessions use case
            // 1. Get user from token (via middleware)
            // 2. Get current session ID from token JTI
            // 3. Fetch all active sessions for user
            // 4. Mark current session with is_current: true
            // 5. Return SessionsResponse

        } catch (error) {
            next(error);
        }
    });

    // ============================================================
    // DELETE /sessions/:session_id
    // ============================================================
    router.delete('/:session_id', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { session_id } = req.params;

            // TODO: Implement revoke session use case
            // 1. Get user from token (via middleware)
            // 2. Find session by ID
            // 3. Verify session belongs to user
            // 4. Add session's token JTI to blacklist
            // 5. Delete session record
            // 6. Return 204

        } catch (error) {
            next(error);
        }
    });

    return router;
};

export { buildSessionController };
