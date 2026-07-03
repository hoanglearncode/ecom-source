/**
 * IP Block Repository Interface
 */

import { BLACKLIST_REASON } from '@/generated/prisma/enums.js';

export interface IIpBlockRepository {
    /**
     * Find IP block
     */
    findByIP(ipAddress: string): Promise<{
        id: string;
        ipAddress: string;
        reason: string;
        attemptCount: number;
        isPermanent: boolean;
        blockedUntil: Date | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;

    /**
     * Check if IP is blocked
     */
    isBlocked(ipAddress: string): Promise<boolean>;

    /**
     * Block IP temporarily
     */
    blockTemporary(ipAddress: string, reason: string, durationMinutes: number): Promise<void>;

    /**
     * Block IP permanently
     */
    blockPermanent(ipAddress: string, reason: string): Promise<void>;

    /**
     * Block IP with reason enum
     */
    block(ipAddress: string, reason: BLACKLIST_REASON, durationMinutes?: number | null): Promise<void>;

    /**
     * Unblock IP
     */
    unblock(ipAddress: string): Promise<boolean>;

    /**
     * Update attempt count
     */
    incrementAttempts(ipAddress: string): Promise<number>;

    /**
     * Reset attempt count
     */
    resetAttempts(ipAddress: string): Promise<boolean>;

    /**
     * Get all blocked IPs
     */
    getAllBlocked(): Promise<Array<{
        ipAddress: string;
        reason: string;
        attemptCount: number;
        isPermanent: boolean;
        blockedUntil: Date | null;
        createdAt: Date;
    }>>;

    /**
     * Get temporarily blocked IPs
     */
    getTemporaryBlocked(): Promise<Array<{
        ipAddress: string;
        blockedUntil: Date;
        reason: string;
    }>>;

    /**
     * Get permanently blocked IPs
     */
    getPermanentBlocked(): Promise<Array<{
        ipAddress: string;
        reason: string;
        createdAt: Date;
    }>>;

    /**
     * Delete expired blocks
     */
    deleteExpired(): Promise<number>;

    /**
     * Get blocked IPs older than specified date
     */
    getOlderThan(date: Date): Promise<Array<{
        id: string;
        ipAddress: string;
        reason: string;
        createdAt: Date;
    }>>;

    /**
     * Get statistics
     */
    getStatistics(): Promise<{
        total: number;
        permanent: number;
        temporary: number;
    }>;

    /**
     * Clean up old temporary blocks
     */
    cleanup(olderThanDays: number): Promise<number>;

    /**
     * Get reason for IP block
     */
    getBlockReason(ipAddress: string): Promise<string | null>;

    /**
     * Get remaining block time (in seconds)
     */
    getRemainingBlockTime(ipAddress: string): Promise<number>;

    /**
     * Find or create IP block record
     */
    findOrCreate(ipAddress: string): Promise<{
        id: string;
        ipAddress: string;
        reason: string;
        attemptCount: number;
        isPermanent: boolean;
        blockedUntil: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
