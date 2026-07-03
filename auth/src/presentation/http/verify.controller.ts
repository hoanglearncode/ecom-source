/**
 * Verify Controller
 * Handles email and OTP verification
 *
 * Routes:
 * - POST   /verify/email            - Verify email via token
 * - POST   /verify/email/resend     - Resend verification email
 * - POST   /verify/otp/send         - Send OTP (SMS or Email)
 * - POST   /verify/otp/confirm      - Confirm OTP
 */

import express, { Request, Response, NextFunction } from 'express';

const buildVerifyController = (): express.Router => {
    const router = express.Router();

    // ============================================================
    // POST /verify/email
    // ============================================================
    router.post('/email', async (req: Request, res: Response, next: NextFunction) => {
        try {

            // TODO: Implement email verification use case
            // 1. Verify the email verification token
            // 2. Extract user_id from token
            // 3. Update user status to ACTIVE
            // 4. Delete verification token
            // 5. Return success response
        } catch (error) {
            next(error);
        }
    });

    // ============================================================
    // POST /verify/email/resend
    // ============================================================
    router.post('/email/resend', async (req: Request, res: Response, next: NextFunction) => {
        try {
            // TODO: Implement resend verification email use case
            // 1. Get user from token (via middleware)
            // 2. Check if user is still UNVERIFIED
            // 3. Generate new verification token
            // 4. Send verification email
            // 5. Apply rate limiting (max 3 per hour)
            // 6. Return 204
        } catch (error) {
            next(error);
        }
    });

    // ============================================================
    // POST /verify/otp/send
    // ============================================================
    router.post('/otp/send', async (req: Request, res: Response, next: NextFunction) => {
        try {

            // TODO: Implement send OTP use case
            // 1. Get user from token (via middleware)
            // 2. Generate 6-digit OTP
            // 3. Store OTP with expiry (5 minutes)
            // 4. Send via SMS or Email based on type
            // 5. Apply rate limiting (max 5 per hour)
            // 6. Return 204

        } catch (error) {
            next(error);
        }
    });

    // ============================================================
    // POST /verify/otp/confirm
    // ============================================================
    router.post('/otp/confirm', async (req: Request, res: Response, next: NextFunction) => {
        try {

            // TODO: Implement OTP confirmation use case
            // 1. Get user from token (via middleware)
            // 2. Retrieve stored OTP
            // 3. Verify OTP matches and not expired
            // 4. Perform action based on type (register, change, etc.)
            // 5. Delete OTP after use
            // 6. Return success response
        } catch (error) {
            next(error);
        }
    });

    return router;
};

export { buildVerifyController };
