import { User, UserRole, UserStatus } from "@/domain/entity/user.entity.js";

/**
 * User Check Result for internal services
 */
export interface UserCheckResult {
    exists: boolean;
    user: {
        id: string;
        email: string | null;
        phone: string | null;
        username: string;
        role: UserRole;
        status: UserStatus;
        isVerified: boolean;
        has2FA: boolean;
    } | null;
}

/**
 * Token Validation Result for internal services
 */
export interface TokenValidationResult {
    isValid: boolean;
    userId: string | null;
    role: UserRole | null;
    expiresAt: Date | null;
    reason?: string;
}

/**
 * Internal Service Check Result
 */
export interface ServiceCheckResult {
    healthy: boolean;
    database: boolean;
    cache: boolean;
    messageQueue: boolean;
    latency: number;
}

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
    userId?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    isSuccess: boolean;
    failureReason?: string;
}

/**
 * Internal Use Case Interface
 * Handles operations for internal microservices communication
 */
export interface InternalUseCaseInterface {
    // ============================================================
    // USER VALIDATION (for other services)
    // ============================================================

    /**
     * Check if user exists and is valid
     * @param userId - User ID
     * @returns User check result
     */
    checkUser(userId: string): Promise<UserCheckResult>;

    /**
     * Check if user has required role
     * @param userId - User ID
     * @param role - Required role
     * @returns True if has role
     */
    hasRole(userId: string, role: UserRole): Promise<boolean>;

    /**
     * Check if user has any of the required roles
     * @param userId - User ID
     * @param roles - List of required roles
     * @returns True if has any role
     */
    hasAnyRole(userId: string, roles: UserRole[]): Promise<boolean>;

    /**
     * Get user role
     * @param userId - User ID
     * @returns User role or null
     */
    getUserRole(userId: string): Promise<UserRole | null>;

    /**
     * Get multiple users by IDs
     * @param userIds - List of user IDs
     * @returns Map of userId to user info
     */
    getUsers(userIds: string[]): Promise<Map<string, Omit<User, 'passwordHash'>>>;

    /**
     * Check if users exist
     * @param userIds - List of user IDs
     * @returns Set of existing user IDs
     */
    checkUsersExist(userIds: string[]): Promise<Set<string>>;

    // ============================================================
    // TOKEN VALIDATION (for other services)
    // ============================================================

    /**
     * Validate access token for internal service
     * @param token - Access token
     * @returns Validation result
     */
    validateToken(token: string): Promise<TokenValidationResult>;

    /**
     * Get user ID from token
     * @param token - Access token
     * @returns User ID or null
     */
    getUserIdFromToken(token: string): Promise<string | null>;

    /**
     * Check if token is blacklisted
     * @param jti - JWT ID
     * @returns True if blacklisted
     */
    isTokenBlacklisted(jti: string): Promise<boolean>;

    // ============================================================
    // AUDIT & LOGGING
    // ============================================================

    /**
     * Create audit log entry
     * @param entry - Audit log entry
     * @returns Success status
     */
    createAuditLog(entry: AuditLogEntry): Promise<boolean>;

    /**
     * Get audit logs for user
     * @param userId - User ID
     * @param limit - Maximum records to return
     * @param offset - Offset for pagination
     * @returns List of audit logs
     */
    getAuditLogs(userId: string, limit?: number, offset?: number): Promise<AuditLogEntry[]>;

    /**
     * Get audit logs by action
     * @param action - Action type
     * @param limit - Maximum records to return
     * @returns List of audit logs
     */
    getAuditLogsByAction(action: string, limit?: number): Promise<AuditLogEntry[]>;

    // ============================================================
    // RATE LIMITING & SECURITY
    // ============================================================

    /**
     * Check if IP is blocked
     * @param ipAddress - IP address
     * @returns True if blocked
     */
    isIpBlocked(ipAddress: string): Promise<boolean>;

    /**
     * Block IP address
     * @param ipAddress - IP address
     * @param reason - Block reason
     * @param duration - Duration in minutes (null = permanent)
     * @returns Success status
     */
    blockIp(ipAddress: string, reason: string, duration?: number | null): Promise<boolean>;

    /**
     * Unblock IP address
     * @param ipAddress - IP address
     * @returns Success status
     */
    unblockIp(ipAddress: string): Promise<boolean>;

    /**
     * Check rate limit for action
     * @param identifier - User ID, IP, or API key
     * @param action - Action type
     * @returns Allowed and remaining info
     */
    checkRateLimit(identifier: string, action: string): Promise<{
        allowed: boolean;
        remaining: number;
        resetAt: Date | null;
    }>;

    /**
     * Record failed login attempt
     * @param identifier - Email, phone, or user ID
     * @param ipAddress - IP address
     * @param reason - Failure reason
     * @returns Attempt count
     */
    recordFailedAttempt(identifier: string, ipAddress: string, reason?: string): Promise<number>;

    /**
     * Reset failed attempt count
     * @param identifier - Email, phone, or user ID
     * @returns Success status
     */
    resetFailedAttempts(identifier: string): Promise<boolean>;

    // ============================================================
    // HEALTH CHECK & METRICS
    // ============================================================

    /**
     * Health check for internal monitoring
     * @returns Service health status
     */
    healthCheck(): Promise<ServiceCheckResult>;

    /**
     * Get service metrics
     * @returns Metrics data
     */
    getMetrics(): Promise<{
        activeUsers: number;
        activeSessions: number;
        requestsPerMinute: number;
        averageResponseTime: number;
    }>;

    /**
     * Get database statistics
     * @returns Database stats
     */
    getDbStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        todayRegistrations: number;
        todayLogins: number;
    }>;

    // ============================================================
    // USER MANAGEMENT (ADMIN)
    // ============================================================

    /**
     * Update user status
     * @param userId - User ID
     * @param status - New status
     * @param adminId - Admin user ID
     * @returns Success status
     */
    updateUserStatus(userId: string, status: UserStatus, adminId: string): Promise<boolean>;

    /**
     * Update user role
     * @param userId - User ID
     * @param role - New role
     * @param adminId - Admin user ID
     * @returns Success status
     */
    updateUserRole(userId: string, role: UserRole, adminId: string): Promise<boolean>;

    /**
     * Force logout user from all devices
     * @param userId - User ID
     * @param adminId - Admin user ID
     * @param reason - Reason for force logout
     * @returns Success status
     */
    forceLogoutUser(userId: string, adminId: string, reason?: string): Promise<boolean>;

    /**
     * Delete user account (admin action)
     * @param userId - User ID
     * @param adminId - Admin user ID
     * @param reason - Reason for deletion
     * @returns Success status
     */
    deleteUserAccount(userId: string, adminId: string, reason?: string): Promise<boolean>;
}
