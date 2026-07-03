/**
 * Two-Factor Authentication Domain Entity
 * Manages TOTP, SMS OTP, Email OTP, and backup codes
 */

// ============================================================
// Enums
// ============================================================

export enum TwoFactorType {
    TOTP = 'TOTP',          // Time-based OTP (Google Authenticator)
    SMS = 'SMS_OTP',       // SMS OTP
    EMAIL = 'EMAIL_OTP',   // Email OTP
    BACKUP = 'BACKUP',     // Backup codes
}

// ============================================================
// TwoFactor Entity Interface
// ============================================================

export interface TwoFactorProps {
    id: string;
    userId: string;
    type: TwoFactorType;
    secret: string | null;
    backupCodes: string[];
    isEnabled: boolean;
    isVerified: boolean;
    enabledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTwoFactorData {
    userId: string;
    type: TwoFactorType;
    secret: string;
    backupCodes?: string[];
}

// ============================================================
// TwoFactor Entity Class
// ============================================================

export class TwoFactor {
    private readonly _id: string;
    private readonly _userId: string;
    private _type: TwoFactorType;
    private _secret: string | null;
    private _backupCodes: string[];
    private _isEnabled: boolean;
    private _isVerified: boolean;
    private _enabledAt: Date | null;
    private readonly _createdAt: Date;
    private _updatedAt: Date;

    private constructor(props: TwoFactorProps) {
        this._id = props.id;
        this._userId = props.userId;
        this._type = props.type;
        this._secret = props.secret;
        this._backupCodes = props.backupCodes || [];
        this._isEnabled = props.isEnabled;
        this._isVerified = props.isVerified;
        this._enabledAt = props.enabledAt;
        this._createdAt = props.createdAt;
        this._updatedAt = props.updatedAt;
    }

    static create(data: CreateTwoFactorData): TwoFactor {
        return new TwoFactor({
            id: crypto.randomUUID(),
            userId: data.userId,
            type: data.type,
            secret: data.secret,
            backupCodes: data.backupCodes || [],
            isEnabled: false,
            isVerified: false,
            enabledAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    static fromPersistence(props: TwoFactorProps): TwoFactor {
        return new TwoFactor(props);
    }

    // ============================================================
    // Business Logic Methods
    // ============================================================

    /**
     * Enable 2FA after verification
     */
    enable(): void {
        this._isEnabled = true;
        this._isVerified = true;
        this._enabledAt = new Date();
        this._updatedAt = new Date();
    }

    /**
     * Disable 2FA
     */
    disable(): void {
        this._isEnabled = false;
        this._isVerified = false;
        this._enabledAt = null;
        this._secret = null;
        this._backupCodes = [];
        this._updatedAt = new Date();
    }

    /**
     * Verify TOTP setup (before enabling)
     */
    verifySetup(): void {
        this._isVerified = true;
        this._updatedAt = new Date();
    }

    /**
     * Update TOTP secret
     */
    updateSecret(secret: string): void {
        this._secret = secret;
        this._isVerified = false;
        this._updatedAt = new Date();
    }

    /**
     * Generate new backup codes
     */
    regenerateBackupCodes(newCodes: string[]): void {
        this._backupCodes = newCodes;
        this._updatedAt = new Date();
    }

    /**
     * Use a backup code (remove from list)
     */
    useBackupCode(code: string): boolean {
        const index = this._backupCodes.findIndex(c => c === code);
        if (index === -1) {
            return false;
        }
        this._backupCodes.splice(index, 1);
        this._updatedAt = new Date();
        return true;
    }

    /**
     * Check if backup code exists
     */
    hasBackupCode(code: string): boolean {
        return this._backupCodes.includes(code);
    }

    /**
     * Get remaining backup codes count
     */
    getRemainingBackupCodesCount(): number {
        return this._backupCodes.length;
    }

    /**
     * Check if 2FA is enabled
     */
    isEnabled(): boolean {
        return this._isEnabled && this._isVerified;
    }

    /**
     * Check if has backup codes available
     */
    hasBackupCodes(): boolean {
        return this._backupCodes.length > 0;
    }

    /**
     * Convert to persistence object
     */
    toPersistence(): TwoFactorProps {
        return {
            id: this._id,
            userId: this._userId,
            type: this._type,
            secret: this._secret,
            backupCodes: this._backupCodes,
            isEnabled: this._isEnabled,
            isVerified: this._isVerified,
            enabledAt: this._enabledAt,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        };
    }

    /**
     * Get public info (without secret)
     */
    toPublicInfo(): {
        id: string;
        userId: string;
        type: TwoFactorType;
        isEnabled: boolean;
        isVerified: boolean;
        hasBackupCodes: boolean;
        backupCodesRemaining: number;
        enabledAt: Date | null;
        createdAt: Date;
    } {
        return {
            id: this._id,
            userId: this._userId,
            type: this._type,
            isEnabled: this._isEnabled,
            isVerified: this._isVerified,
            hasBackupCodes: this.hasBackupCodes(),
            backupCodesRemaining: this.getRemainingBackupCodesCount(),
            enabledAt: this._enabledAt,
            createdAt: this._createdAt,
        };
    }

    // ============================================================
    // Getters
    // ============================================================

    get id(): string { return this._id; }
    get userId(): string { return this._userId; }
    get type(): TwoFactorType { return this._type; }
    get secret(): string | null { return this._secret; }
    get backupCodes(): string[] { return [...this._backupCodes]; }
    get isEnabled(): boolean { return this._isEnabled; }
    get isVerified(): boolean { return this._isVerified; }
    get enabledAt(): Date | null { return this._enabledAt; }
    get createdAt(): Date { return this._createdAt; }
    get updatedAt(): Date { return this._updatedAt; }
}

// ============================================================
// TwoFactor Entity Utility Functions
// ============================================================

export class TwoFactorEntity {
    /**
     * Generate TOTP secret (Base32 encoded)
     * Note: In production, use a proper library like 'otpauth' or 'speakeasy'
     */
    static generateTOTPSecret(): string {
        // Generate a random 20-byte secret and encode to base32
        const bytes = new Uint8Array(20);
        crypto.getRandomValues(bytes);
        return this.base32Encode(bytes);
    }

    /**
     * Generate backup codes
     */
    static generateBackupCodes(count: number = 10): string[] {
        const codes: string[] = [];
        for (let i = 0; i < count; i++) {
            // Generate 8-character alphanumeric code
            const code = this.generateRandomCode(8);
            codes.push(code);
        }
        return codes;
    }

    /**
     * Generate random code
     */
    private static generateRandomCode(length: number): string {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        let code = '';
        for (let i = 0; i < length; i++) {
            code += chars[bytes[i] % chars.length];
        }
        return code;
    }

    /**
     * Generate OTP code (numeric)
     */
    static generateOTP(length: number = 6): string {
        const digits = '0123456789';
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += digits[bytes[i] % digits.length];
        }
        return otp;
    }

    /**
     * Encode bytes to Base32
     */
    private static base32Encode(bytes: Uint8Array): string {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        let output = '';

        for (let i = 0; i < bytes.length; i++) {
            value = (value << 8) | bytes[i];
            bits += 8;

            while (bits >= 5) {
                output += alphabet[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }

        if (bits > 0) {
            output += alphabet[(value << (5 - bits)) & 31];
        }

        return output;
    }

    /**
     * Generate QR code URI for TOTP
     * Format: otpauth://totp/Service:Username?secret=Secret&issuer=Service
     */
    static generateTOTPUri(
        service: string,
        username: string,
        secret: string,
        issuer?: string
    ): string {
        const encodedUsername = encodeURIComponent(username);
        const encodedIssuer = issuer ? encodeURIComponent(issuer) : encodeURIComponent(service);
        return `otpauth://totp/${encodedIssuer}:${encodedUsername}?secret=${secret}&issuer=${encodedIssuer}`;
    }

    /**
     * Hash OTP for storage
     */
    static hashOTP(otp: string): string {
        // In production, use bcrypt or argon2
        // This is a simplified version for demo
        const encoder = new TextEncoder();
        const data = encoder.encode(otp + process.env.OTP_SALT || 'salt');
        return crypto.subtle.digest('SHA-256', data).then(buffer => {
            return Array.from(new Uint8Array(buffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        }).then(hash => `<otp_hash:${hash}>`);
    }

    /**
     * Verify TOTP token
     * Note: This is a simplified implementation
     * In production, use 'otpauth' or 'speakeasy' library
     */
    static async verifyTOTP(token: string, secret: string): Promise<boolean> {
        // Placeholder implementation
        // Real implementation would:
        // 1. Decode Base32 secret
        // 2. Calculate current time counter
        // 3. Generate expected TOTP values for current and neighboring time windows
        // 4. Compare with provided token
        return token.length === 6 && /^\d+$/.test(token);
    }

    /**
     * Calculate remaining backup codes
     */
    static calculateRemainingCodes(totalGenerated: number, usedCount: number): number {
        return Math.max(0, totalGenerated - usedCount);
    }

    /**
     * Validate backup code format
     */
    static isValidBackupCode(code: string): boolean {
        return /^[A-Z0-9]{8}$/.test(code);
    }

    /**
     * Validate OTP format
     */
    static isValidOTP(code: string): boolean {
        return /^\d{6}$/.test(code);
    }
}
