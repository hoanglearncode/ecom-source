/**
 * Session information
 */
export interface SessionInfo {
    id: string;
    userId: string;
    deviceName: string | null;
    deviceType: string | null;
    deviceId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    isCurrent: boolean;
    lastUsedAt: Date | null;
    createdAt: Date;
}

/**
 * Create Session Data
 */
export interface CreateSessionData {
    userId: string;
    deviceId?: string;
    deviceName?: string;
    deviceType?: 'mobile' | 'desktop' | 'tablet' | 'api';
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Session Use Case Interface
 * Handles user session management
 */
export interface SessionUseCaseInterface {
    /**
     * Create new session for user
     * @param data - Session data
     * @returns Created session info
     */
    createSession(data: CreateSessionData): Promise<SessionInfo>;

    /**
     * Get all active sessions for user
     * @param userId - User ID
     * @returns List of active sessions
     */
    getUserSessions(userId: string): Promise<SessionInfo[]>;

    /**
     * Get specific session
     * @param sessionId - Session ID
     * @param userId - User ID (for authorization)
     * @returns Session info or null
     */
    getSession(sessionId: string, userId: string): Promise<SessionInfo | null>;

    /**
     * Revoke specific session
     * @param sessionId - Session ID
     * @param userId - User ID (for authorization)
     * @returns Success status
     */
    revokeSession(sessionId: string, userId: string): Promise<boolean>;

    /**
     * Revoke all sessions for user
     * @param userId - User ID
     * @returns Success status
     */
    revokeAllSessions(userId: string): Promise<boolean>;

    /**
     * Revoke all sessions except current
     * @param userId - User ID
     * @param currentSessionId - Current session to keep
     * @returns Success status
     */
    revokeOtherSessions(userId: string, currentSessionId: string): Promise<boolean>;

    /**
     * Revoke sessions by device
     * @param userId - User ID
     * @param deviceId - Device ID
     * @returns Success status
     */
    revokeSessionsByDevice(userId: string, deviceId: string): Promise<boolean>;

    /**
     * Update session last used timestamp
     * @param sessionId - Session ID
     * @returns Success status
     */
    updateSessionActivity(sessionId: string): Promise<boolean>;

    /**
     * Check if session is valid
     * @param sessionId - Session ID
     * @returns True if valid
     */
    isSessionValid(sessionId: string): Promise<boolean>;

    /**
     * Get session by device ID
     * @param userId - User ID
     * @param deviceId - Device ID
     * @returns Session info or null
     */
    getSessionByDevice(userId: string, deviceId: string): Promise<SessionInfo | null>;

    /**
     * Get active session count for user
     * @param userId - User ID
     * @returns Number of active sessions
     */
    getActiveSessionCount(userId: string): Promise<number>;

    /**
     * Clean up expired sessions
     * @param olderThanDays - Clean sessions older than X days
     * @returns Number of sessions cleaned
     */
    cleanupExpiredSessions(olderThanDays?: number): Promise<number>;

    /**
     * Revoke sessions by IP address
     * @param ipAddress - IP address
     * @returns Success status
     */
    revokeSessionsByIP(ipAddress: string): Promise<boolean>;

    /**
     * Get sessions older than specified date
     * @param userId - User ID
     * @param date - Date threshold
     * @returns List of old sessions
     */
    getOldSessions(userId: string, date: Date): Promise<SessionInfo[]>;

    /**
     * Check if user has session from device
     * @param userId - User ID
     * @param deviceId - Device ID
     * @returns True if session exists
     */
    hasDeviceSession(userId: string, deviceId: string): Promise<boolean>;
}
