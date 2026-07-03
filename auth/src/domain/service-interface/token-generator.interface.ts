/**
 * Token Generator Service Interface
 * Defines contract for JWT token generation and validation
 */

export interface TokenPayload {
    sub: string;          // User ID
    email?: string;
    username?: string;
    role: string;
    jti: string;          // JWT ID for blacklist
    iat: number;
    exp: number;
    [key: string]: any;   // Additional claims
}

export interface TokenOptions {
    expiresIn?: string | number;  // e.g., '15m', '7d', 3600
    issuer?: string;
    audience?: string | string[];
    subject?: string;
}

export interface ITokenGenerator {
    /**
     * Generate access token
     * @param payload - Token payload data
     * @param options - Token generation options
     * @returns Signed JWT token
     */
    generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, options?: TokenOptions): string;

    /**
     * Generate refresh token
     * @param payload - Token payload data
     * @param options - Token generation options
     * @returns Signed JWT token
     */
    generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, options?: TokenOptions): string;

    /**
     * Verify and decode token
     * @param token - JWT token to verify
     * @returns Decoded token payload
     * @throws Error if token is invalid
     */
    verify(token: string): TokenPayload;

    /**
     * Decode token without verification (for inspection)
     * @param token - JWT token to decode
     * @returns Decoded token payload or null
     */
    decode(token: string): TokenPayload | null;

    /**
     * Extract JWT ID from token
     * @param token - JWT token
     * @returns JWT ID or null
     */
    getJti(token: string): string | null;

    /**
     * Extract user ID from token
     * @param token - JWT token
     * @returns User ID or null
     */
    getUserId(token: string): string | null;

    /**
     * Check if token is expired
     * @param token - JWT token
     * @returns True if expired
     */
    isExpired(token: string): boolean;

    /**
     * Get token expiration time
     * @param token - JWT token
     * @returns Expiration date or null
     */
    getExpiration(token: string): Date | null;

    /**
     * Get token issue time
     * @param token - JWT token
     * @returns Issue date or null
     */
    getIssuedAt(token: string): Date | null;

    /**
     * Generate random JTI
     * @returns Random UUID
     */
    generateJti(): string;
}
