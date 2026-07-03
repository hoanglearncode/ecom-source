/**
 * Audit Log Repository Interface
 */

export interface IAuditLogRepository {
    /**
     * Create audit log entry
     */
    create(data: {
        userId?: string;
        action: string;
        resource?: string;
        resourceId?: string;
        ipAddress?: string;
        userAgent?: string;
        oldValue?: unknown;
        newValue?: unknown;
        metadata?: unknown;
        isSuccess: boolean;
        failureReason?: string;
    }): Promise<string>;

    /**
     * Get audit logs for user
     */
    getByUserId(userId: string, options?: {
        limit?: number;
        offset?: number;
        action?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{
        id: string;
        userId: string | null;
        action: string;
        resource: string | null;
        resourceId: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        oldValue: unknown;
        newValue: unknown;
        metadata: unknown;
        isSuccess: boolean;
        failureReason: string | null;
        createdAt: Date;
    }>>;

    /**
     * Get audit logs by action
     */
    getByAction(action: string, options?: {
        limit?: number;
        offset?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{
        id: string;
        userId: string | null;
        action: string;
        resource: string | null;
        resourceId: string | null;
        isSuccess: boolean;
        createdAt: Date;
    }>>;

    /**
     * Get audit logs by resource
     */
    getByResource(resource: string, resourceId: string): Promise<Array<{
        id: string;
        userId: string | null;
        action: string;
        oldValue: unknown;
        newValue: unknown;
        isSuccess: boolean;
        createdAt: Date;
    }>>;

    /**
     * Get audit logs by IP address
     */
    getByIP(ipAddress: string, options?: {
        limit?: number;
        offset?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{
        id: string;
        userId: string | null;
        action: string;
        isSuccess: boolean;
        createdAt: Date;
    }>>;

    /**
     * Get failed login attempts for user
     */
    getFailedLogins(userId: string, limit?: number): Promise<Array<{
        id: string;
        action: string;
        ipAddress: string | null;
        failureReason: string | null;
        createdAt: Date;
    }>>;

    /**
     * Get audit logs by multiple user IDs
     */
    getByUserIds(userIds: string[], options?: {
        limit?: number;
        offset?: number;
        actions?: string[];
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{
        id: string;
        userId: string | null;
        action: string;
        resource: string | null;
        resourceId: string | null;
        isSuccess: boolean;
        createdAt: Date;
    }>>;

    /**
     * Count audit logs by criteria
     */
    count(criteria?: {
        userId?: string;
        action?: string;
        isSuccess?: boolean;
        startDate?: Date;
        endDate?: Date;
    }): Promise<number>;

    /**
     * Delete old audit logs
     */
    deleteOlderThan(date: Date): Promise<number>;

    /**
     * Get statistics
     */
    getStatistics(options?: {
        userId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        total: number;
        successful: number;
        failed: number;
        byAction: Record<string, number>;
    }>;

    /**
     * Get recent activity for users
     */
    getRecentActivity(userIds: string[], limit?: number): Promise<Map<string, Array<{
        action: string;
        createdAt: Date;
    }>>>;
}
