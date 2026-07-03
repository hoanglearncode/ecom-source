/**
 * API Key information
 */
export interface ApiKeyInfo {
    id: string;
    name: string;
    keyPrefix: string;
    scopes: string[];
    ipWhitelist: string[];
    rateLimit: number | null;
    isActive: boolean;
    expiresAt: Date | null;
    lastUsedAt: Date | null;
    createdAt: Date;
}

/**
 * Create API Key Data
 */
export interface CreateApiKeyData {
    name: string;
    scopes?: string[];
    ipWhitelist?: string[];
    rateLimit?: number;
    expiresAt?: Date;
}

/**
 * API Key Response (with full key on creation)
 */
export interface ApiKeyResponse extends ApiKeyInfo {
    key: string; // Full API key (only shown on creation)
}

/**
 * API Key Validation Result
 */
export interface ApiKeyValidation {
    isValid: boolean;
    apiKeyId: string | null;
    userId: string | null;
    scopes: string[];
    rateLimit: number | null;
    reason?: string;
}
