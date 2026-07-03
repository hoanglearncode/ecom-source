/**
 * OAuth Account Repository Interface
 */

import { OAUTH_PROVIDER } from '@/generated/prisma/enums.js';

export interface IOAuthAccountRepository {
    /**
     * Find OAuth account by provider and provider ID
     */
    findByProviderAndId(provider: OAUTH_PROVIDER, providerId: string): Promise<{
        id: string;
        userId: string;
        provider: OAUTH_PROVIDER;
        providerId: string;
        accessToken: string | null;
        refreshToken: string | null;
        tokenExpiresAt: Date | null;
        rawData: unknown;
        createdAt: Date;
        updatedAt: Date;
    } | null>;

    /**
     * Find OAuth accounts by user ID
     */
    findByUserId(userId: string): Promise<Array<{
        id: string;
        userId: string;
        provider: OAUTH_PROVIDER;
        providerId: string;
        tokenExpiresAt: Date | null;
        createdAt: Date;
    }>>;

    /**
     * Find user ID by OAuth account
     */
    findUserIdByProvider(provider: OAUTH_PROVIDER, providerId: string): Promise<string | null>;

    /**
     * Check if OAuth account is linked
     */
    isLinked(userId: string, provider: OAUTH_PROVIDER): Promise<boolean>;

    /**
     * Check if provider ID is already linked to any user
     */
    isProviderIdLinked(provider: OAUTH_PROVIDER, providerId: string): Promise<boolean>;

    /**
     * Create OAuth account link
     */
    create(data: {
        userId: string;
        provider: OAUTH_PROVIDER;
        providerId: string;
        accessToken?: string;
        refreshToken?: string;
        tokenExpiresAt?: Date;
        rawData?: unknown;
    }): Promise<{
        id: string;
        userId: string;
        provider: OAUTH_PROVIDER;
        providerId: string;
        createdAt: Date;
    }>;

    /**
     * Update OAuth tokens
     */
    updateTokens(id: string, accessToken: string, refreshToken?: string, tokenExpiresAt?: Date): Promise<boolean>;

    /**
     * Update raw data
     */
    updateRawData(id: string, rawData: unknown): Promise<boolean>;

    /**
     * Unlink OAuth account
     */
    unlink(userId: string, provider: OAUTH_PROVIDER): Promise<boolean>;

    /**
     * Unlink by ID
     */
    unlinkById(id: string): Promise<boolean>;

    /**
     * Delete all OAuth accounts for user
     */
    deleteAllForUser(userId: string): Promise<number>;

    /**
     * Get OAuth account with tokens
     */
    getWithTokens(userId: string, provider: OAUTH_PROVIDER): Promise<{
        id: string;
        userId: string;
        provider: OAUTH_PROVIDER;
        providerId: string;
        accessToken: string | null;
        refreshToken: string | null;
        tokenExpiresAt: Date | null;
    } | null>;

    /**
     * Refresh access token
     */
    refreshAccessToken(id: string, newAccessToken: string, newRefreshToken?: string, expiresAt?: Date): Promise<boolean>;

    /**
     * Find expired tokens for refresh
     */
    findExpiredTokens(): Promise<Array<{
        id: string;
        userId: string;
        provider: OAUTH_PROVIDER;
        refreshToken: string | null;
    }>>;

    /**
     * Get all users linked to provider
     */
    findUsersByProvider(provider: OAUTH_PROVIDER): Promise<Array<{
        userId: string;
        providerId: string;
        createdAt: Date;
    }>>;

    /**
     * Count linked accounts for user
     */
    countByUser(userId: string): Promise<number>;
}
