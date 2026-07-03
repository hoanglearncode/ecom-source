
import { ApiKeyInfo, ApiKeyResponse, ApiKeyValidation } from "@/presentation/response-formatter/api-key.js";
import { CreateApiKeyDTO } from "../dto/api-key.dto.js";
/**
 * API Key Use Case Interface
 * Handles API key management for server-to-server and developer access
 */
export interface ApiKeyUseCaseInterface {
    /**
     * Create new API key for user
     * @param userId - User ID
     * @param data - API key data
     * @returns Created API key with full key
     */
    createApiKey(userId: string, data: CreateApiKeyDTO): Promise<ApiKeyResponse>;

    /**
     * Get API key by ID
     * @param keyId - API Key ID
     * @param userId - User ID (for authorization)
     * @returns API key info or null
     */
    getApiKey(keyId: string, userId: string): Promise<ApiKeyInfo | null>;

    /**
     * List all API keys for user
     * @param userId - User ID
     * @returns List of API keys
     */
    listApiKeys(userId: string): Promise<ApiKeyInfo[]>;

    /**
     * Revoke API key
     * @param keyId - API Key ID
     * @param userId - User ID (for authorization)
     * @returns Success status
     */
    revokeApiKey(keyId: string, userId: string): Promise<boolean>;

    /**
     * Update API key
     * @param keyId - API Key ID
     * @param userId - User ID (for authorization)
     * @param data - Update data
     * @returns Updated API key
     */
    updateApiKey(
        keyId: string,
        userId: string,
        data: Partial<Omit<CreateApiKeyDTO, 'name'>>
    ): Promise<ApiKeyInfo>;

    /**
     * Validate API key
     * @param key - API key string
     * @returns Validation result
     */
    validateApiKey(key: string): Promise<ApiKeyValidation>;

    /**
     * Check if API key has required scope
     * @param key - API key string
     * @param scope - Required scope
     * @returns True if has scope
     */
    hasScope(key: string, scope: string): Promise<boolean>;

    /**
     * Check if API key has any of the required scopes
     * @param key - API key string
     * @param scopes - List of required scopes
     * @returns True if has any scope
     */
    hasAnyScope(key: string, scopes: string[]): Promise<boolean>;

    /**
     * Check if IP is whitelisted for API key
     * @param key - API key string
     * @param ip - IP address
     * @returns True if IP is allowed
     */
    isIpAllowed(key: string, ip: string): Promise<boolean>;

    /**
     * Update last used timestamp
     * @param keyId - API Key ID
     * @returns Success status
     */
    updateLastUsed(keyId: string): Promise<boolean>;

    /**
     * Get API key rate limit
     * @param key - API key string
     * @returns Rate limit or null
     */
    getRateLimit(key: string): Promise<number | null>;

    /**
     * Clean up expired API keys
     * @returns Number of keys cleaned
     */
    cleanupExpiredKeys(): Promise<number>;

    /**
     * Get API key usage statistics
     * @param keyId - API Key ID
     * @param userId - User ID (for authorization)
     * @returns Usage statistics
     */
    getApiKeyStats(keyId: string, userId: string): Promise<{
        lastUsedAt: Date | null;
        requestCount: number; // If tracking is implemented
        errorCount: number; // If tracking is implemented
    }>;

    /**
     * Regenerate API key (same scopes, new key)
     * @param keyId - API Key ID
     * @param userId - User ID (for authorization)
     * @returns New API key with full key
     */
    regenerateApiKey(keyId: string, userId: string): Promise<ApiKeyResponse>;

    /**
     * Activate API key
     * @param keyId - API Key ID
     * @param userId - User ID (for authorization)
     * @returns Success status
     */
    activateApiKey(keyId: string, userId: string): Promise<boolean>;

    /**
     * Deactivate API key (soft revoke)
     * @param keyId - API Key ID
     * @param userId - User ID (for authorization)
     * @returns Success status
     */
    deactivateApiKey(keyId: string, userId: string): Promise<boolean>;
}
