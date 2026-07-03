/**
 * HTTP Routes Configuration
 * Mounts all controllers with appropriate middleware
 */

import express, { Router } from 'express';
import {
    buildAuthController,
    buildTokenController,
    buildVerifyController,
    buildPasswordController,
    buildTwoFactorController,
    buildOAuthController,
    buildSessionController,
    buildAPIKeyController,
    buildInternalController,
} from './index.js';
import {
    authenticateBearer,
    authenticateApiKey,
    requireAdmin,
    addRateLimitHeaders,
} from './middleware/index.js';

// ============================================================
// Route Builder
// ============================================================

export const buildRoutes = (): Router => {
    const router = Router();
    const v1Router = Router();

    // Apply rate limit headers to all routes
    v1Router.use(addRateLimitHeaders);

    // ============================================================
    // AUTH ROUTES (Public)
    // ============================================================
    const authController = buildAuthController();
    v1Router.use('/auth', authController);

    // ============================================================
    // TOKEN ROUTES (Public/Protected)
    // ============================================================
    const tokenController = buildTokenController();
    v1Router.use('/token', tokenController);

    // ============================================================
    // VERIFY ROUTES (Public/Protected)
    // ============================================================
    const verifyController = buildVerifyController();
    v1Router.use('/verify', verifyController);

    // ============================================================
    // PASSWORD ROUTES (Public/Protected)
    // ============================================================
    const passwordController = buildPasswordController();
    v1Router.use('/password', passwordController);

    // ============================================================
    // TWO-FACTOR ROUTES (Protected)
    // ============================================================
    const twoFactorController = buildTwoFactorController();
    v1Router.use('/2fa', authenticateBearer, twoFactorController);

    // ============================================================
    // OAUTH ROUTES (Public)
    // ============================================================
    const oauthController = buildOAuthController();
    v1Router.use('/oauth', oauthController);

    // ============================================================
    // SESSION ROUTES (Protected)
    // ============================================================
    const sessionController = buildSessionController();
    v1Router.use('/sessions', authenticateBearer, sessionController);

    // ============================================================
    // API KEY ROUTES (Protected)
    // ============================================================
    const apiKeyController = buildAPIKeyController();
    v1Router.use('/api-keys', authenticateBearer, apiKeyController);


    // ============================================================
    // INTERNAL ROUTES (API Key Auth)
    // ============================================================
    const internalController = buildInternalController();
    v1Router.use('/internal', authenticateApiKey, internalController);

    // Mount v1 routes directly (version prefix is added at app level in index.ts)
    router.use('/v1', v1Router);

    // Health check
    router.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    return router;
};

// ============================================================
// Route Documentation (OpenAPI Mapping)
// ============================================================

/**
 * Route Map:
 *
 * Auth (Public):
 * - POST   /v1/auth/register           RegisterRequest → RegisterResponse
 * - POST   /v1/auth/login              LoginRequest → LoginResponse | TwoFactorChallengeResponse
 * - POST   /v1/auth/logout             LogoutRequest → 204
 * - POST   /v1/auth/logout-all         → 204
 *
 * Token (Public/Protected):
 * - POST   /v1/token/refresh           RefreshTokenRequest → TokenPair
 * - POST   /v1/token/revoke            RevokeTokenRequest → 204
 * - POST   /v1/token/introspect        TokenIntrospectRequest → TokenIntrospectResponse
 *
 * Verify (Public/Protected):
 * - POST   /v1/verify/email            VerifyEmailRequest → VerifyResponse
 * - POST   /v1/verify/email/resend     → 204
 * - POST   /v1/verify/otp/send         SendOtpRequest → 204
 * - POST   /v1/verify/otp/confirm      ConfirmOtpRequest → VerifyResponse
 *
 * Password (Public/Protected):
 * - POST   /v1/password/change         ChangePasswordRequest → 204
 * - POST   /v1/password/forgot         ForgotPasswordRequest → 204
 * - POST   /v1/password/reset          ResetPasswordRequest → 204
 *
 * Two-Factor (Protected):
 * - POST   /v1/2fa/setup               → TwoFactorSetupResponse
 * - POST   /v1/2fa/verify-setup        → TwoFactorActivateResponse
 * - POST   /v1/2fa/verify              TwoFactorVerifyRequest → LoginResponse
 * - DELETE /v1/2fa/disable             TwoFactorDisableRequest → 204
 * - POST   /v1/2fa/backup-codes         → BackupCodesResponse
 *
 * OAuth (Public):
 * - GET    /v1/oauth/:provider/redirect → OAuthRedirectResponse
 * - POST   /v1/oauth/:provider/callback → OAuthCallbackResponse
 *
 * Session (Protected):
 * - GET    /v1/sessions                → SessionsResponse
 * - DELETE /v1/sessions/:session_id    → 204
 *
 * API Key (Protected):
 * - GET    /v1/api-keys                → ApiKeysResponse
 * - POST   /v1/api-keys                CreateApiKeyRequest → CreateApiKeyResponse
 * - DELETE /v1/api-keys/:key_id        → 204
 *
 * Admin (Admin Only):
 * - GET    /v1/admin/users             → PaginatedUsers
 * - POST   /v1/admin/users/:user_id/ban → 204
 * - POST   /v1/admin/users/:user_id/unban → 204
 * - PATCH  /v1/admin/users/:user_id/role → 204
 * - GET    /v1/admin/audit-logs        → PaginatedAuditLogs
 * - GET    /v1/admin/ip-blocks         → IpBlocksResponse
 * - POST   /v1/admin/ip-blocks         → 201
 * - DELETE /v1/admin/ip-blocks/:ip     → 204
 *
 * Internal (API Key):
 * - POST   /v1/internal/validate-token → ValidateTokenResponse
 * - GET    /v1/internal/user/:user_id   → InternalUserInfo
 * - POST   /v1/internal/check-permission → CheckPermissionResponse
 */
