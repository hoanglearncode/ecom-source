/**
 * Token Domain Entity
 * Manages access and refresh tokens for user sessions
 */

// ============================================================
// Enums
// ============================================================

export enum TokenType {
    ACCESS = 'ACCESS',
    REFRESH = 'REFRESH',
}

export enum DeviceType {
    MOBILE = 'mobile',
    DESKTOP = 'desktop',
    TABLET = 'tablet',
    API = 'api',
}

// ============================================================
// Token Entity Interface
// ============================================================

export interface TokenProps {
    id: string;
    userId: string;
    accessJti: string;
    refreshToken: string;
    deviceId: string | null;
    deviceName: string | null;
    deviceType: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    isRevoked: boolean;
    accessExpiresAt: Date;
    refreshExpiresAt: Date;
    lastUsedAt: Date | null;
    createdAt: Date;
}

export interface CreateTokenData {
    userId: string;
    accessJti: string;
    refreshToken: string;
    deviceId?: string | null;
    deviceName?: string | null;
    deviceType?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    accessExpiresAt: Date;
    refreshExpiresAt: Date;
}

// ============================================================
// Token Entity Class
// ============================================================

export class Token {
    private readonly _id: string;
    private readonly _userId: string;
    private readonly _accessJti: string;
    private _refreshToken: string;
    private _deviceId: string | null;
    private _deviceName: string | null;
    private _deviceType: string | null;
    private _ipAddress: string | null;
    private _userAgent: string | null;
    private _isRevoked: boolean;
    private readonly _accessExpiresAt: Date;
    private readonly _refreshExpiresAt: Date;
    private _lastUsedAt: Date | null;
    private readonly _createdAt: Date;

    private constructor(props: TokenProps) {
        this._id = props.id;
        this._userId = props.userId;
        this._accessJti = props.accessJti;
        this._refreshToken = props.refreshToken;
        this._deviceId = props.deviceId;
        this._deviceName = props.deviceName;
        this._deviceType = props.deviceType;
        this._ipAddress = props.ipAddress;
        this._userAgent = props.userAgent;
        this._isRevoked = props.isRevoked;
        this._accessExpiresAt = props.accessExpiresAt;
        this._refreshExpiresAt = props.refreshExpiresAt;
        this._lastUsedAt = props.lastUsedAt;
        this._createdAt = props.createdAt;
    }

    static create(data: CreateTokenData): Token {
        return new Token({
            id: crypto.randomUUID(),
            userId: data.userId,
            accessJti: data.accessJti,
            refreshToken: data.refreshToken,
            deviceId: data.deviceId || null,
            deviceName: data.deviceName || null,
            deviceType: data.deviceType || null,
            ipAddress: data.ipAddress || null,
            userAgent: data.userAgent || null,
            isRevoked: false,
            accessExpiresAt: data.accessExpiresAt,
            refreshExpiresAt: data.refreshExpiresAt,
            lastUsedAt: null,
            createdAt: new Date(),
        });
    }

    static fromPersistence(props: TokenProps): Token {
        return new Token(props);
    }

    // ============================================================
    // Business Logic Methods
    // ============================================================

    /**
     * Check if access token is expired
     */
    isAccessExpired(): boolean {
        return this._accessExpiresAt < new Date();
    }

    /**
     * Check if refresh token is expired
     */
    isRefreshExpired(): boolean {
        return this._refreshExpiresAt < new Date();
    }

    /**
     * Check if token is valid (not revoked and not expired)
     */
    isValid(): boolean {
        return !this._isRevoked && !this.isAccessExpired();
    }

    /**
     * Check if refresh token is valid
     */
    isRefreshValid(): boolean {
        return !this._isRevoked && !this.isRefreshExpired();
    }

    /**
     * Revoke token
     */
    revoke(): void {
        this._isRevoked = true;
    }

    /**
     * Update last used timestamp
     */
    updateLastUsed(): void {
        this._lastUsedAt = new Date();
    }

    /**
     * Update device info
     */
    updateDeviceInfo(deviceName: string | null, deviceType: string | null): void {
        this._deviceName = deviceName;
        this._deviceType = deviceType;
    }

    /**
     * Check if token belongs to specific device
     */
    isFromDevice(deviceId: string): boolean {
        return this._deviceId === deviceId;
    }

    /**
     * Check if token belongs to specific IP
     */
    isFromIP(ip: string): boolean {
        return this._ipAddress === ip;
    }

    /**
     * Get time until access token expires (in seconds)
     */
    getAccessExpiresIn(): number {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = Math.floor(this._accessExpiresAt.getTime() / 1000);
        return Math.max(0, expiresAt - now);
    }

    /**
     * Get time until refresh token expires (in seconds)
     */
    getRefreshExpiresIn(): number {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = Math.floor(this._refreshExpiresAt.getTime() / 1000);
        return Math.max(0, expiresAt - now);
    }

    /**
     * Convert to persistence object
     */
    toPersistence(): TokenProps {
        return {
            id: this._id,
            userId: this._userId,
            accessJti: this._accessJti,
            refreshToken: this._refreshToken,
            deviceId: this._deviceId,
            deviceName: this._deviceName,
            deviceType: this._deviceType,
            ipAddress: this._ipAddress,
            userAgent: this._userAgent,
            isRevoked: this._isRevoked,
            accessExpiresAt: this._accessExpiresAt,
            refreshExpiresAt: this._refreshExpiresAt,
            lastUsedAt: this._lastUsedAt,
            createdAt: this._createdAt,
        };
    }

    /**
     * Get token info (without sensitive data)
     */
    toTokenInfo(): {
        id: string;
        userId: string;
        deviceName: string | null;
        deviceType: string | null;
        deviceId: string | null;
        ipAddress: string | null;
        lastUsedAt: Date | null;
        createdAt: Date;
        isRevoked: boolean;
    } {
        return {
            id: this._id,
            userId: this._userId,
            deviceName: this._deviceName,
            deviceType: this._deviceType,
            deviceId: this._deviceId,
            ipAddress: this._ipAddress,
            lastUsedAt: this._lastUsedAt,
            createdAt: this._createdAt,
            isRevoked: this._isRevoked,
        };
    }

    // ============================================================
    // Getters
    // ============================================================

    get id(): string { return this._id; }
    get userId(): string { return this._userId; }
    get accessJti(): string { return this._accessJti; }
    get refreshToken(): string { return this._refreshToken; }
    get deviceId(): string | null { return this._deviceId; }
    get deviceName(): string | null { return this._deviceName; }
    get deviceType(): string | null { return this._deviceType; }
    get ipAddress(): string | null { return this._ipAddress; }
    get userAgent(): string | null { return this._userAgent; }
    get isRevoked(): boolean { return this._isRevoked; }
    get accessExpiresAt(): Date { return this._accessExpiresAt; }
    get refreshExpiresAt(): Date { return this._refreshExpiresAt; }
    get lastUsedAt(): Date | null { return this._lastUsedAt; }
    get createdAt(): Date { return this._createdAt; }
}

// ============================================================
// Token Entity Utility Functions
// ============================================================

export class TokenEntity {
    /**
     * Generate JWT ID for access token
     */
    static generateJti(): string {
        return crypto.randomUUID();
    }

    /**
     * Calculate access token expiration
     */
    static getAccessExpiration(expiresIn: string = '15m'): Date {
        const seconds = this.parseExpiration(expiresIn);
        return new Date(Date.now() + seconds * 1000);
    }

    /**
     * Calculate refresh token expiration
     */
    static getRefreshExpiration(expiresIn: string = '7d'): Date {
        const seconds = this.parseExpiration(expiresIn);
        return new Date(Date.now() + seconds * 1000);
    }

    /**
     * Parse expiration string to seconds
     * Supports: 15m, 1h, 7d, etc.
     */
    private static parseExpiration(exp: string): number {
        const match = exp.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error(`Invalid expiration format: ${exp}`);
        }

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 3600;
            case 'd':
                return value * 86400;
            default:
                throw new Error(`Invalid expiration unit: ${unit}`);
        }
    }

    /**
     * Extract device name from user agent
     */
    static parseDeviceName(userAgent: string): string {
        // Simple implementation - can be enhanced with proper UA parser
        if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
            return 'iOS Device';
        }
        if (userAgent.includes('Android')) {
            return 'Android Device';
        }
        if (userAgent.includes('Mac')) {
            return 'Macintosh';
        }
        if (userAgent.includes('Windows')) {
            return 'Windows PC';
        }
        if (userAgent.includes('Linux')) {
            return 'Linux PC';
        }
        return 'Unknown Device';
    }

    /**
     * Extract device type from user agent
     */
    static parseDeviceType(userAgent: string): DeviceType {
        if (userAgent.includes('iPhone') || userAgent.includes('Android') && userAgent.includes('Mobile')) {
            return DeviceType.MOBILE;
        }
        if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
            return DeviceType.TABLET;
        }
        if (userAgent.includes('Postman') || userAgent.includes('curl')) {
            return DeviceType.API;
        }
        return DeviceType.DESKTOP;
    }
}
