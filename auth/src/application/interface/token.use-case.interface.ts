import { RefreshTokenDto, RefreshTokenResponseDto } from "@/application/dto/refresh-token.dto.js";

/**
 * Token information
 */
export interface TokenInfo {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
}

/**
 * Token payload
 */
export interface TokenPayload {
    sub: string; // User ID
    email: string;
    role: string;
    iat: number;
    exp: number;
    jti: string; // JWT ID for blacklist
}

/**
 * Device information for token tracking
 */
export interface DeviceInfo {
    deviceId?: string;
    deviceName?: string;
    deviceType?: 'mobile' | 'desktop' | 'tablet' | 'api';
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Token Use Case Interface
 * Handles JWT token generation, validation, and refresh
 */
export interface TokenUseCaseInterface {
    /**
     * Generate access and refresh tokens for user
     * @param userId - User ID
     * @param deviceInfo - Optional device information
     * @returns Token pair with expiration
     */
    generateTokens(userId: string, deviceInfo?: DeviceInfo): Promise<TokenInfo>;

    /**
     * Refresh access token using refresh token
     * @param data - Refresh token data
     * @returns New token pair
     */
    refreshToken(data: RefreshTokenDto): Promise<RefreshTokenResponseDto>;

    /**
     * Validate access token
     * @param token - Access token to validate
     * @returns Token payload if valid
     */
    validateAccessToken(token: string): TokenPayload | null;

    /**
     * Validate refresh token
     * @param token - Refresh token to validate
     * @returns Token info if valid
     */
    validateRefreshToken(token: string): {
        userId: string;
        deviceId: string | null;
        expiresAt: Date;
    } | null;

    /**
     * Revoke specific token (add to blacklist)
     * @param jti - JWT ID
     * @param reason - Reason for revocation
     * @returns Success status
     */
    revokeToken(jti: string, reason?: string): Promise<boolean>;

    /**
     * Revoke all tokens for user
     * @param userId - User ID
     * @returns Success status
     */
    revokeAllUserTokens(userId: string): Promise<boolean>;

    /**
     * Revoke all tokens except current
     * @param userId - User ID
     * @param currentJti - Current JWT ID to keep
     * @returns Success status
     */
    revokeOtherTokens(userId: string, currentJti: string): Promise<boolean>;

    /**
     * Check if token is blacklisted
     * @param jti - JWT ID
     * @returns True if blacklisted
     */
    isTokenBlacklisted(jti: string): Promise<boolean>;

    /**
     * Get all active sessions for user
     * @param userId - User ID
     * @returns List of active sessions
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
     * Revoke specific session
     * @param sessionId - Session/Token ID
     * @param userId - User ID for authorization
     * @returns Success status
     */
    revokeSession(sessionId: string, userId: string): Promise<boolean>;

    /**
     * Clean up expired tokens
     * @returns Number of tokens cleaned
     */
    cleanupExpiredTokens(): Promise<number>;

    /**
     * Clean up expired blacklist entries
     * @returns Number of entries cleaned
     */
    cleanupExpiredBlacklist(): Promise<number>;
}
