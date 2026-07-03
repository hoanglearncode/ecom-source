/**
 * Password History Repository Interface
 */

export interface IPasswordHistoryRepository {
    /**
     * Add password to history
     */
    add(userId: string, passwordHash: string, ipAddress?: string): Promise<string>;

    /**
     * Get password history for user
     */
    getByUserId(userId: string, limit?: number): Promise<Array<{
        id: string;
        userId: string;
        passwordHash: string;
        ipAddress: string | null;
        createdAt: Date;
    }>>;

    /**
     * Check if password exists in user's history
     */
    isInHistory(userId: string, passwordHash: string, limit?: number): Promise<boolean>;

    /**
     * Get password count in history
     */
    count(userId: string): Promise<number>;

    /**
     * Clean up old password history (keep last N)
     */
    cleanup(userId: string, keepCount: number): Promise<number>;

    /**
     * Delete all history for user
     */
    deleteAll(userId: string): Promise<number>;

    /**
     * Delete history older than specified date
     */
    deleteOlderThan(userId: string, date: Date): Promise<number>;

    /**
     * Get last password change date
     */
    getLastChangeDate(userId: string): Promise<Date | null>;

    /**
     * Get recent passwords (last N)
     */
    getRecent(userId: string, count: number): Promise<string[]>;
}
