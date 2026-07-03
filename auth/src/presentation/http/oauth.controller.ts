/**
 * OAuth Controller
 * Handles social login via OAuth providers
 *
 * Routes:
 * - GET    /oauth/:provider/redirect  - Get OAuth redirect URL
 * - POST   /oauth/:provider/callback  - Handle OAuth callback
 */

import express, { Request, Response, NextFunction } from 'express';

const SUPPORTED_PROVIDERS = ['google', 'facebook', 'github', 'apple', 'zalo'] as const;
type OAuthProvider = (typeof SUPPORTED_PROVIDERS)[number];

const buildOAuthController = (): express.Router => {
    const router = express.Router();

    // ============================================================
    // GET /oauth/:provider/redirect
    // ============================================================
    router.get('/:provider/redirect', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { provider } = req.params;
            const { redirect_uri } = req.query;

            // TODO: Implement OAuth redirect use case
            // 1. Validate provider is supported
            // 2. Validate redirect_uri format
            // 3. Generate state token for CSRF protection
            // 4. Store state with redirect_uri in cache
            // 5. Build provider's authorization URL
            // 6. Return OAuthRedirectResponse
        } catch (error) {
            next(error);
        }
    });

    // ============================================================
    // POST /oauth/:provider/callback
    // ============================================================
    router.post('/:provider/callback', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { provider } = req.params;

            // TODO: Implement OAuth callback use case
            // 1. Validate provider is supported
            // 2. Verify state from cache
            // 3. Exchange code for access token with provider
            // 4. Fetch user info from provider
            // 5. Find existing user by provider account ID
            // 6. If not found, create new account (auto-verify email)
            // 7. Link provider account to user
            // 8. Generate access + refresh tokens
            // 9. Return OAuthCallbackResponse with is_new_user flag
        } catch (error) {
            next(error);
        }
    });

    return router;
};

export { buildOAuthController };
