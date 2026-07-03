/**
 * OAuth Provider
 */
export enum OAuthProvider {
    GOOGLE = 'GOOGLE',
    FACEBOOK = 'FACEBOOK',
    GITHUB = 'GITHUB',
    APPLE = 'APPLE',
    ZALO = 'ZALO'
}

/**
 * OAuth Account Information
 */
export interface OAuthAccountInfo {
    id: string;
    userId: string;
    provider: OAuthProvider;
    providerId: string;
    providerEmail?: string;
    providerUsername?: string;
    avatarUrl?: string;
    isConnected: boolean;
    tokenExpiresAt: Date | null;
    createdAt: Date;
}

/**
 * OAuth User Profile from Provider
 */
export interface OAuthUserProfile {
    provider: OAuthProvider;
    providerId: string;
    email?: string;
    emailVerified?: boolean;
    name?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    avatarUrl?: string;
    locale?: string;
    rawProfile?: Record<string, unknown>;
}

/**
 * OAuth Token Response from Provider
 */
export interface OAuthTokenResponse {
    accessToken: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
    scope?: string;
    rawResponse?: Record<string, unknown>;
}

/**
 * OAuth Authentication Result
 */
export interface OAuthAuthResult {
    user: {
        id: string;
        email: string | null;
        username: string;
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
        isNewUser: boolean;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

/**
 * OAuth Use Case Interface
 * Handles OAuth/social login operations
 */
export interface OAuthUseCaseInterface {
    /**
     * Authenticate user via OAuth
     * @param provider - OAuth provider
     * @param authCode - Authorization code from provider
     * @param redirectUri - Redirect URI used in request
     * @param deviceInfo - Optional device information
     * @returns Authentication result
     */
    authenticateWithOAuth(
        provider: OAuthProvider,
        authCode: string,
        redirectUri: string,
        deviceInfo?: {
            deviceId?: string;
            deviceName?: string;
            deviceType?: string;
            ipAddress?: string;
            userAgent?: string;
        }
    ): Promise<OAuthAuthResult>;

    /**
     * Get OAuth authorization URL
     * @param provider - OAuth provider
     * @param redirectUri - Redirect URI
     * @param state - CSRF state token
     * @param scopes - Additional scopes (optional)
     * @returns Authorization URL
     */
    getAuthorizationUrl(
        provider: OAuthProvider,
        redirectUri: string,
        state: string,
        scopes?: string[]
    ): string;

    /**
     * Exchange authorization code for access token
     * @param provider - OAuth provider
     * @param code - Authorization code
     * @param redirectUri - Redirect URI
     * @returns Token response
     */
    exchangeCodeForToken(
        provider: OAuthProvider,
        code: string,
        redirectUri: string
    ): Promise<OAuthTokenResponse>;

    /**
     * Get user profile from provider using access token
     * @param provider - OAuth provider
     * @param accessToken - Provider access token
     * @returns User profile
     */
    getUserProfile(
        provider: OAuthProvider,
        accessToken: string
    ): Promise<OAuthUserProfile>;

    /**
     * Link OAuth account to existing user
     * @param userId - User ID
     * @param provider - OAuth provider
     * @param authCode - Authorization code
     * @param redirectUri - Redirect URI
     * @returns Linked account info
     */
    linkOAuthAccount(
        userId: string,
        provider: OAuthProvider,
        authCode: string,
        redirectUri: string
    ): Promise<OAuthAccountInfo>;

    /**
     * Unlink OAuth account from user
     * @param userId - User ID
     * @param provider - OAuth provider
     * @returns Success status
     */
    unlinkOAuthAccount(userId: string, provider: OAuthProvider): Promise<boolean>;

    /**
     * Get all linked OAuth accounts for user
     * @param userId - User ID
     * @returns List of linked accounts
     */
    getLinkedAccounts(userId: string): Promise<OAuthAccountInfo[]>;

    /**
     * Refresh provider access token
     * @param userId - User ID
     * @param provider - OAuth provider
     * @returns New access token or null
     */
    refreshProviderToken(userId: string, provider: OAuthProvider): Promise<string | null>;

    /**
     * Revoke provider access
     * @param userId - User ID
     * @param provider - OAuth provider
     * @returns Success status
     */
    revokeProviderAccess(userId: string, provider: OAuthProvider): Promise<boolean>;

    /**
     * Find user by OAuth account
     * @param provider - OAuth provider
     * @param providerId - Provider user ID
     * @returns User ID or null
     */
    findUserByOAuthAccount(provider: OAuthProvider, providerId: string): Promise<string | null>;

    /**
     * Check if OAuth account is linked
     * @param userId - User ID
     * @param provider - OAuth provider
     * @returns True if linked
     */
    isOAuthLinked(userId: string, provider: OAuthProvider): Promise<boolean>;

    /**
     * Get provider-specific data
     * @param userId - User ID
     * @param provider - OAuth provider
     * @returns Provider data or null
     */
    getProviderData(userId: string, provider: OAuthProvider): Promise<Record<string, unknown> | null>;

    /**
     * Validate OAuth state token (CSRF protection)
     * @param state - State token from callback
     * @returns True if valid
     */
    validateOAuthState(state: string): Promise<boolean>;

    /**
     * Generate OAuth state token
     * @returns State token
     */
    generateOAuthState(): string;

    /**
     * Handle OAuth error
     * @param provider - OAuth provider
     * @param errorCode - Error code from provider
     * @param errorDescription - Error description
     * @returns User-friendly error message
     */
    handleOAuthError(
        provider: OAuthProvider,
        errorCode: string,
        errorDescription?: string
    ): string;

    /**
     * Sync user profile from provider
     * @param userId - User ID
     * @param provider - OAuth provider
     * @returns Updated user info
     */
    syncProfileFromProvider(userId: string, provider: OAuthProvider): Promise<{
        avatarUrl?: string;
        locale?: string;
    }>;
}
