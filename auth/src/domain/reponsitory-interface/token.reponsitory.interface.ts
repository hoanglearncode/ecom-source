/**
 * Token Repository Interface
 * Defines the contract for token data persistence operations
 */

import { Token, type TokenProps, type CreateTokenData } from '@/domain/entity/token.entity.js';

// ============================================================
// Token Repository Interface
// ============================================================

export interface ITokenRepository {
    // ============================================================
    // CRUD Operations
    // ============================================================

    /**
     * Find token by ID
     */
    findById(id: string): Promise<Token | null>;

    /**
     * Find token by access JWT ID
     */
    findByAccessJti(accessJti: string): Promise<Token | null>;

    /**
     * Find token by refresh token
     */
    findByRefreshToken(refreshToken: string): Promise<Token | null>;

    /**
     * Find all tokens for user
     */
    findByUserId(userId: string): Promise<Token[]>;

    /**
     * Find active tokens for user
     */
    findActiveByUserId(userId: string): Promise<Token[]>;

    /**
     * Find token by user and device
     */
    findByUserAndDevice(userId: string, deviceId: string): Promise<Token | null>;

    /**
     * Create new token
     */
    create(data: CreateTokenData): Promise<Token>;

    /**
     * Update token
     */
    update(id: string, data: Partial<TokenProps>): Promise<Token | null>;

    /**
     * Delete token
     */
    delete(id: string): Promise<boolean>;

    // ============================================================
    // Token State Operations
    // ============================================================

    /**
     * Revoke token
     */
    revoke(id: string): Promise<boolean>;

    /**
     * Revoke all tokens for user
     */
    revokeAllForUser(userId: string): Promise<number>;

    /**
     * Revoke all tokens for user except specific token
     */
    revokeAllExcept(userId: string, exceptTokenId: string): Promise<number>;

    /**
     * Revoke tokens by device
     */
    revokeByDevice(userId: string, deviceId: string): Promise<number>;

    /**
     * Update last used timestamp
     */
    updateLastUsed(id: string): Promise<boolean>;

    /**
     * Update device info
     */
    updateDeviceInfo(id: string, deviceName: string, deviceType: string): Promise<boolean>;

    // ============================================================
    // Query Operations
    // ============================================================

    /**
     * Get active session count for user
     */
    getActiveCount(userId: string): Promise<number>;

    /**
     * Get all active sessions with details
     */
    getActiveSessions(userId: string): Promise<Array<{
        id: string;
        deviceName: string | null;
        deviceType: string | null;
        ipAddress: string | null;
        lastUsedAt: Date | null;
        createdAt: Date;
    }>>;

    /**
     * Check if user has token from device
     */
    hasDeviceToken(userId: string, deviceId: string): Promise<boolean>;

    /**
     * Get sessions older than specified date
     */
    getOldSessions(userId: string, olderThan: Date): Promise<Token[]>;

    /**
     * Get count of expired tokens
     */
    getExpiredCount(): Promise<number>;

    // ============================================================
    // Cleanup Operations
    // ============================================================

    /**
     * Delete expired tokens
     */
    deleteExpired(): Promise<number>;

    /**
     * Delete revoked tokens older than specified date
     */
    deleteOldRevoked(olderThan: Date): Promise<number>;

    /**
     * Delete all tokens for user
     */
    deleteAllForUser(userId: string): Promise<number>;

    // ============================================================
    // Token Validation
    // ============================================================

    /**
     * Check if refresh token is valid
     */
    isRefreshTokenValid(refreshToken: string): Promise<boolean>;

    /**
     * Check if access JTI exists and is not revoked
     */
    isAccessJtiValid(accessJti: string): Promise<boolean>;

    /**
     * Get token by refresh token and validate
     */
    validateRefreshToken(refreshToken: string): Promise<{
        userId: string;
        deviceId: string | null;
        expiresAt: Date;
        isValid: boolean;
    } | null>;

    // ============================================================
    // Bulk Operations
    // ============================================================

    /**
     * Get tokens by multiple user IDs
     */
    findByUserIds(userIds: string[]): Promise<Token[]>;

    /**
     * Revoke tokens by IP address
     */
    revokeByIP(ipAddress: string): Promise<number>;

    /**
     * Get tokens by IP address
     */
    findByIP(ipAddress: string): Promise<Token[]>;

    // ============================================================
    // Transaction Operations
    // ============================================================

    /**
     * Execute operation within transaction
     */
    transaction<T>(callback: (tx: any) => Promise<T>): Promise<T>;
}
