/**
 * Password Controller
 * Handles password management: change, forgot, reset
 *
 * Routes:
 * - POST   /password/change         - Change password (authenticated)
 * - POST   /password/forgot        - Request password reset
 * - POST   /password/reset         - Reset password with token
 */

import express, { Request, Response, NextFunction } from 'express';

const buildPasswordController = (): express.Router => {
    const router = express.Router();

    // ============================================================
    // POST /password/change
    // ============================================================
    router.post('/change', async (req: Request, res: Response, next: NextFunction) => {
        try {
            // TODO: Implement change password use case
            // 1. Get user from token (via middleware)
            // 2. Verify current password
            // 3. Check new password not in last 5 passwords
            // 4. Hash new password
            // 5. Update password hash and password_changed_at
            // 6. Store in password history
            // 7. Revoke all existing tokens (force re-login)
            // 8. Return 204
        } catch (error) {
            next(error);
        }
    });

    // ============================================================
    // POST /password/forgot
    // ============================================================
    router.post('/forgot', async (req: Request, res: Response, next: NextFunction) => {
        try {

            // TODO: Implement forgot password use case
            // 1. Find user by email
            // 2. Always return 204 (to prevent email enumeration)
            // 3. If user exists:
            //    - Generate reset token
            //    - Store token with expiry (1 hour)
            //    - Send reset link via email
            // 4. Apply strict rate limiting (max 3 per hour per IP)
            // 5. Return 204
        } catch (error) {
            next(error);
        }
    });

    // ============================================================
    // POST /password/reset
    // ============================================================
    router.post('/reset', async (req: Request, res: Response, next: NextFunction) => {
        try {

            // TODO: Implement reset password use case
            // 1. Verify reset token
            // 2. Extract user from token
            // 3. Validate new password strength
            // 4. Hash new password
            // 5. Update password hash and password_changed_at
            // 6. Delete reset token
            // 7. Revoke all existing tokens
            // 8. Return 204

        } catch (error) {
            next(error);
        }
    });

    return router;
};

export { buildPasswordController };
