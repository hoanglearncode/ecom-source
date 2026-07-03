/**
 * API Key Repository Interface
 */

export interface IApiKeyRepository {
    /**
     * Find API key by ID
     */
    findById(id: string): Promise<{
        id: string;
        userId: string;
        name: string;
        keyHash: string;
        keyPrefix: string;
        scopes: unknown;
        ipWhitelist: string[];
        rateLimit: number | null;
        isActive: boolean;
        expiresAt: Date | null;
        lastUsedAt: Date | null;
        createdAt: Date;
        revokedAt: Date | null;
    } | null>;

    /**
     * Find API key by hash
     */
    findByKeyHash(keyHash: string): Promise<{
        id: string;
        userId: string;
        name: string;
        keyHash: string;
        keyPrefix: string;
        scopes: unknown;
        ipWhitelist: string[];
        rateLimit: number | null;
        isActive: boolean;
        expiresAt: Date | null;
        lastUsedAt: Date | null;
        createdAt: Date;
        revokedAt: Date | null;
    } | null>;

    /**
     * Get all API keys for user
     */
    getByUserId(userId: string): Promise<Array<{
        id: string;
        name: string;
        keyPrefix: string;
        scopes: unknown;
        ipWhitelist: string[];
        rateLimit: number | null;
        isActive: boolean;
        expiresAt: Date | null;
        lastUsedAt: Date | null;
        createdAt: Date;
        revokedAt: Date | null;
    }>>;

    /**
     * Get active API keys for user
     */
    getActiveByUserId(userId: string): Promise<Array<{
        id: string;
        name: string;
        keyPrefix: string;
        scopes: unknown;
        ipWhitelist: string[];
        rateLimit: number | null;
        expiresAt: Date | null;
        lastUsedAt: Date | null;
        createdAt: Date;
    }>>;

    /**
     * Create API key
     */
    create(data: {
        userId: string;
        name: string;
        keyHash: string;
        keyPrefix: string;
        scopes?: unknown;
        ipWhitelist?: string[];
        rateLimit?: number | null;
        expiresAt?: Date | null;
    }): Promise<{
        id: string;
        userId: string;
        name: string;
        keyPrefix: string;
        scopes: unknown;
        ipWhitelist: string[];
        rateLimit: number | null;
        isActive: boolean;
        expiresAt: Date | null;
        createdAt: Date;
    }>;

    /**
     * Update API key
     */
    update(id: string, data: {
        name?: string;
        scopes?: unknown;
        ipWhitelist?: string[];
        rateLimit?: number | null;
        expiresAt?: Date | null;
    }): Promise<boolean>;

    /**
     * Revoke API key
     */
    revoke(id: string): Promise<boolean>;

    /**
     * Activate API key
     */
    activate(id: string): Promise<boolean>;

    /**
     * Deactivate API key (soft revoke)
     */
    deactivate(id: string): Promise<boolean>;

    /**
     * Update last used timestamp
     */
    updateLastUsed(id: string): Promise<boolean>;

    /**
     * Validate API key
     */
    validate(keyHash: string): Promise<{
        id: string;
        userId: string;
        name: string;
        scopes: unknown;
        ipWhitelist: string[];
        rateLimit: number | null;
        isActive: boolean;
        expiresAt: Date | null;
    } | null>;

    /**
     * Check if API key is valid
     */
    isValid(id: string): Promise<boolean>;

    /**
     * Check if IP is whitelisted for API key
     */
    isIPAllowed(keyId: string, ip: string): Promise<boolean>;

    /**
     * Get rate limit for API key
     */
    getRateLimit(keyId: string): Promise<number | null>;

    /**
     * Get scopes for API key
     */
    getScopes(keyId: string): Promise<string[]>;

    /**
     * Check if API key has scope
     */
    hasScope(keyId: string, scope: string): Promise<boolean>;

    /**
     * Count active keys for user
     */
    countActive(userId: string): Promise<number>;

    /**
     * Delete expired keys
     */
    deleteExpired(): Promise<number>;

    /**
     * Delete revoked keys older than specified date
     */
    deleteOldRevoked(olderThan: Date): Promise<number>;

    /**
     * Get usage statistics
     */
    getUsageStats(keyId: string): Promise<{
        lastUsedAt: Date | null;
        createdAt: Date;
    }>;

    /**
     * Regenerate API key (new hash, same settings)
     */
    regenerate(id: string, newKeyHash: string, newKeyPrefix: string): Promise<boolean>;

    /**
     * Delete all keys for user
     */
    deleteAllForUser(userId: string): Promise<number>;

    /**
     * Get key by ID for user (authorization check)
     */
    getForUser(keyId: string, userId: string): Promise<{
        id: string;
        name: string;
        keyPrefix: string;
        scopes: unknown;
        ipWhitelist: string[];
        rateLimit: number | null;
        isActive: boolean;
        expiresAt: Date | null;
        lastUsedAt: Date | null;
        createdAt: Date;
        revokedAt: Date | null;
    } | null>;
}
