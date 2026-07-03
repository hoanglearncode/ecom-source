import { VerifyEmailDto, ResendVerificationDto } from "@/application/dto/verify-email.dto.js";

/**
 * Verification Type
 */
export enum VerifyType {
    EMAIL_REGISTER = 'EMAIL_REGISTER',       // Email verification on registration
    EMAIL_CHANGE = 'EMAIL_CHANGE',           // Verify new email when changing
    PHONE_REGISTER = 'PHONE_REGISTER',       // Phone verification on registration
    PHONE_CHANGE = 'PHONE_CHANGE',            // Verify new phone when changing
    PASSWORD_RESET = 'PASSWORD_RESET',       // Password reset verification
    TWO_FACTOR_ENABLE = 'TWO_FACTOR_ENABLE', // Verify when enabling 2FA
    DEVICE_TRUST = 'DEVICE_TRUST'             // Verify new/trusted device
}

/**
 * Verification Method
 */
export enum VerifyMethod {
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    TOTP = 'TOTP'
}

/**
 * Verification Status
 */
export interface VerificationStatus {
    isVerified: boolean;
    type: VerifyType;
    expiresAt: Date;
    attemptsRemaining: number;
}

/**
 * Verification Use Case Interface
 * Handles email/SMS verification operations
 */
export interface VerifyUseCaseInterface {
    /**
     * Verify email with token
     * @param data - Verification token
     * @returns Success status
     */
    verifyEmail(data: VerifyEmailDto): Promise<boolean>;

    /**
     * Resend verification email
     * @param data - Email address
     * @returns Success status
     */
    resendVerificationEmail(data: ResendVerificationDto): Promise<boolean>;

    /**
     * Verify phone with OTP
     * @param userId - User ID
     * @param code - OTP code
     * @returns Success status
     */
    verifyPhone(userId: string, code: string): Promise<boolean>;

    /**
     * Send phone verification OTP
     * @param userId - User ID
     * @param phone - Phone number
     * @returns Success status
     */
    sendPhoneVerification(userId: string, phone: string): Promise<boolean>;

    /**
     * Create verification token
     * @param userId - User ID
     * @param type - Verification type
     * @param expiresIn - Expiration in seconds
     * @returns Verification token
     */
    createVerification(userId: string, type: VerifyType, expiresIn?: number): Promise<string>;

    /**
     * Create OTP for verification
     * @param userId - User ID
     * @param type - Verification type
     * @param expiresIn - Expiration in seconds
     * @returns OTP code
     */
    createOTP(userId: string, type: VerifyType, expiresIn?: number): Promise<string>;

    /**
     * Verify token
     * @param token - Verification token
     * @param type - Expected verification type
     * @returns Success status
     */
    verifyToken(token: string, type: VerifyType): Promise<boolean>;

    /**
     * Verify OTP
     * @param userId - User ID
     * @param code - OTP code
     * @param type - Verification type
     * @returns Success status
     */
    verifyOTP(userId: string, code: string, type: VerifyType): Promise<boolean>;

    /**
     * Check verification status
     * @param userId - User ID
     * @param type - Verification type
     * @returns Verification status
     */
    getVerificationStatus(userId: string, type: VerifyType): Promise<VerificationStatus | null>;

    /**
     * Invalidate verification
     * @param token - Verification token
     * @returns Success status
     */
    invalidateVerification(token: string): Promise<boolean>;

    /**
     * Clean up expired verifications
     * @returns Number of records cleaned
     */
    cleanupExpiredVerifications(): Promise<number>;

    /**
     * Get remaining attempts for verification
     * @param token - Verification token
     * @returns Number of attempts remaining
     */
    getRemainingAttempts(token: string): Promise<number>;

    /**
     * Increment failed attempt count
     * @param token - Verification token
     * @returns Updated attempt count
     */
    incrementFailedAttempt(token: string): Promise<number>;

    /**
     * Check if user is verified
     * @param userId - User ID
     * @param type - Verification type
     * @returns True if verified
     */
    isUserVerified(userId: string, type: VerifyType): Promise<boolean>;

    /**
     * Mark user as verified
     * @param userId - User ID
     * @param type - Verification type
     * @returns Success status
     */
    markUserAsVerified(userId: string, type: VerifyType): Promise<boolean>;
}
