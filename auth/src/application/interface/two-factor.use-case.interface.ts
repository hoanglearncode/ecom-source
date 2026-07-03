import { Enable2FADto, Enable2FAResponseDto, Verify2FADto, Disable2FADto } from "@/application/dto/two-factor.dto.js";

/**
 * Two-Factor Authentication Type
 */
export enum TwoFactorType {
    TOTP = 'TOTP', // Time-based OTP (Google Authenticator)
    SMS = 'SMS',   // SMS OTP
    EMAIL = 'EMAIL', // Email OTP
    BACKUP = 'BACKUP' // Backup codes
}

/**
 * Two-Factor Authentication Status
 */
export interface TwoFactorStatus {
    isEnabled: boolean;
    isVerified: boolean;
    type: TwoFactorType;
    hasBackupCodes: boolean;
    backupCodesRemaining: number;
}

/**
 * Two-Factor Authentication Use Case Interface
 * Handles 2FA operations
 */
export interface TwoFactorUseCaseInterface {
    /**
     * Enable two-factor authentication for user
     * @param userId - User ID
     * @param data - Password confirmation
     * @returns QR code and backup codes
     */
    enable2FA(userId: string, data: Enable2FADto): Promise<Enable2FAResponseDto>;

    /**
     * Verify and complete 2FA setup
     * @param userId - User ID
     * @param token - TOTP token
     * @returns Success status
     */
    verify2FASetup(userId: string, token: string): Promise<boolean>;

    /**
     * Verify 2FA token during login
     * @param userId - User ID
     * @param data - Token to verify
     * @returns Success status
     */
    verify2FALogin(userId: string, data: Verify2FADto): Promise<boolean>;

    /**
     * Disable two-factor authentication
     * @param userId - User ID
     * @param data - Password and token confirmation
     * @returns Success status
     */
    disable2FA(userId: string, data: Disable2FADto): Promise<boolean>;

    /**
     * Generate new backup codes
     * @param userId - User ID
     * @param password - User password for confirmation
     * @returns New backup codes
     */
    regenerateBackupCodes(userId: string, password: string): Promise<string[]>;

    /**
     * Use backup code for login
     * @param userId - User ID
     * @param code - Backup code
     * @returns Success status
     */
    useBackupCode(userId: string, code: string): Promise<boolean>;

    /**
     * Get 2FA status for user
     * @param userId - User ID
     * @returns 2FA status
     */
    get2FAStatus(userId: string): Promise<TwoFactorStatus>;

    /**
     * Send SMS OTP
     * @param userId - User ID
     * @param phone - Phone number
     * @returns Success status
     */
    sendSMSOTP(userId: string, phone: string): Promise<boolean>;

    /**
     * Send Email OTP
     * @param userId - User ID
     * @param email - Email address
     * @returns Success status
     */
    sendEmailOTP(userId: string, email: string): Promise<boolean>;

    /**
     * Verify OTP (SMS/Email)
     * @param userId - User ID
     * @param code - OTP code
     * @param type - OTP type
     * @returns Success status
     */
    verifyOTP(userId: string, code: string, type: 'SMS' | 'EMAIL'): Promise<boolean>;

    /**
     * Check if user has 2FA enabled
     * @param userId - User ID
     * @returns True if 2FA is enabled
     */
    is2FAEnabled(userId: string): Promise<boolean>;

    /**
     * Get remaining backup codes count
     * @param userId - User ID
     * @returns Number of unused backup codes
     */
    getBackupCodesCount(userId: string): Promise<number>;

    /**
     * Validate TOTP token
     * @param userId - User ID
     * @param token - TOTP token
     * @returns True if valid
     */
    validateTOTPToken(userId: string, token: string): Promise<boolean>;
}
