/**
 * API Key Controller
 * Handles API key management for server-to-server authentication
 *
 * Routes:
 * - GET    /api-keys               - List user's API keys
 * - POST   /api-keys               - Create new API key
 * - DELETE /api-keys/:key_id       - Revoke an API key
 */

import express, { Request, Response, NextFunction } from 'express';

const buildAPIKeyController = (): express.Router => {
    const router = express.Router();

    // ============================================================
    // GET /api-keys
    // ============================================================
    router.get('/', async (req: Request, res: Response, next: NextFunction) => {
        try {
            // TODO: Implement list API keys use case
            // 1. Get user from token (via middleware)
            // 2. Fetch all API keys for user
            // 3. Return only key_prefix (never full key after creation)
            // 4. Return ApiKeysResponse


        } catch (error) {
            next(error);
        }
    });

    // ============================================================
    // POST /api-keys
    // ============================================================
    router.post('/', async (req: Request, res: Response, next: NextFunction) => {
        try {

            // TODO: Implement create API key use case
            // 1. Get user from token (via middleware)
            // 2. Validate scopes are allowed for user role
            // 3. Generate API key (random secret + prefix)
            // 4. Hash the key for storage
            // 5. Store key with metadata
            // 6. Return full key ONLY this one time
            // 7. Return CreateApiKeyResponse

           
        } catch (error) {
            next(error);
        }
    });

    // ============================================================
    // DELETE /api-keys/:key_id
    // ============================================================
    router.delete('/:key_id', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { key_id } = req.params;

            // TODO: Implement revoke API key use case
            // 1. Get user from token (via middleware)
            // 2. Find API key by ID
            // 3. Verify key belongs to user
            // 4. Mark key as revoked (soft delete)
            // 5. Return 204

        } catch (error) {
            next(error);
        }
    });

    return router;
};

export { buildAPIKeyController };
