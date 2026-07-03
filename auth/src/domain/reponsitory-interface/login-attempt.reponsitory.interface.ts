/**
 * Login Attempt Repository Interface
 */

export interface ILoginAttemptRepository {
    /**
     * Record login attempt
     */
    create(data: {
        userId?: string;
        emailOrPhone?: string;
        ipAddress: string;
        deviceId?: string;
        isSuccess: boolean;
        failureReason?: string;
    }): Promise<string>;

    /**
     * Get login attempts for user
     */
    getByUserId(userId: string, options?: {
        limit?: number;
        offset?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{
        id: string;
        userId: string | null;
        emailOrPhone: string | null;
        ipAddress: string;
        isSuccess: boolean;
        failureReason: string | null;
        createdAt: Date;
    }>>;

    /**
     * Get login attempts by IP address
     */
    getByIP(ipAddress: string, options?: {
        limit?: number;
        offset?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{
        id: string;
        userId: string | null;
        emailOrPhone: string | null;
        ipAddress: string;
        isSuccess: boolean;
        failureReason: string | null;
        createdAt: Date;
    }>>;

    /**
     * Get login attempts by email/phone
     */
    getByEmailOrPhone(emailOrPhone: string, options?: {
        limit?: number;
        offset?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{
        id: string;
        userId: string | null;
        emailOrPhone: string | null;
        ipAddress: string;
        isSuccess: boolean;
        failureReason: string | null;
        createdAt: Date;
    }>>;

    /**
     * Count failed attempts for identifier
     */
    countFailedAttempts(identifier: {
        userId?: string;
        emailOrPhone?: string;
        ipAddress?: string;
        since?: Date;
    }): Promise<number>;

    /**
     * Get last failed attempt
     */
    getLastFailed(identifier: {
        userId?: string;
        emailOrPhone?: string;
        ipAddress?: string;
    }): Promise<{
        id: string;
        failureReason: string | null;
        createdAt: Date;
    } | null>;

    /**
     * Get failed attempts count in time window
     */
    countFailedInWindow(ipAddress: string, windowMinutes: number): Promise<number>;

    /**
     * Get failed attempts count for user in time window
     */
    countFailedForUserInWindow(userId: string, windowMinutes: number): Promise<number>;

    /**
     * Delete old login attempts
     */
    deleteOlderThan(date: Date): Promise<number>;

    /**
     * Get statistics
     */
    getStatistics(options?: {
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        total: number;
        successful: number;
        failed: number;
        uniqueIPs: number;
        uniqueUsers: number;
    }>;

    /**
     * Get suspicious activity (multiple failed attempts from same IP)
     */
    getSuspiciousIPs(threshold: number, windowMinutes: number): Promise<Array<{
        ipAddress: string;
        failedCount: number;
        lastAttempt: Date;
    }>>;

    /**
     * Get brute force targets (users with multiple failed attempts)
     */
    getBruteForceTargets(threshold: number, windowMinutes: number): Promise<Array<{
        userId: string | null;
        emailOrPhone: string | null;
        failedCount: number;
        lastAttempt: Date;
    }>>;

    /**
     * Clean up old records
     */
    cleanup(olderThanDays: number): Promise<number>;
}
