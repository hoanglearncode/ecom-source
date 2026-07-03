import { ChangePasswordDto, PasswordResetRequestDto, PasswordResetConfirmDto, PasswordResponseDto } from "@/application/dto/password.dto.js";

/**
 * Password Use Case Interface
 * Handles password management operations
 */
export interface PasswordUseCaseInterface {
    /**
     * Change user password (authenticated)
     * @param userId - User ID
     * @param data - Password change data
     * @returns Response with success status
     */
    changePassword(userId: string, data: ChangePasswordDto): Promise<PasswordResponseDto>;

    /**
     * Request password reset (send email/SMS)
     * @param data - Email for password reset
     * @returns Response with success status
     */
    requestPasswordReset(data: PasswordResetRequestDto): Promise<PasswordResponseDto>;

    /**
     * Confirm password reset with token
     * @param data - Reset token and new password
     * @returns Response with success status
     */
    confirmPasswordReset(data: PasswordResetConfirmDto): Promise<PasswordResponseDto>;

    /**
     * Validate reset token
     * @param token - Reset token
     * @returns True if valid
     */
    validateResetToken(token: string): Promise<boolean>;

    /**
     * Check if password matches history (prevent reuse)
     * @param userId - User ID
     * @param newPassword - New password to check
     * @returns True if password was used before
     */
    isPasswordInHistory(userId: string, newPassword: string): Promise<boolean>;

    /**
     * Add current password to history before changing
     * @param userId - User ID
     * @param passwordHash - Current password hash
     * @returns Success status
     */
    addToPasswordHistory(userId: string, passwordHash: string): Promise<boolean>;

    /**
     * Clean up old password history (keep last N)
     * @param userId - User ID
     * @param keepCount - Number of records to keep
     * @returns Success status
     */
    cleanupPasswordHistory(userId: string, keepCount?: number): Promise<boolean>;

    /**
     * Check if password needs to be changed (force password change)
     * @param userId - User ID
     * @returns True if password change is required
     */
    requiresPasswordChange(userId: string): Promise<boolean>;

    /**
     * Set password change required flag
     * @param userId - User ID
     * @param required - Whether change is required
     * @returns Success status
     */
    setRequirePasswordChange(userId: string, required: boolean): Promise<boolean>;

    /**
     * Validate password strength
     * @param password - Password to validate
     * @returns Validation result with score and feedback
     */
    validatePasswordStrength(password: string): {
        isValid: boolean;
        score: number; // 0-4
        feedback: string[];
    };

    /**
     * Generate secure random password
     * @param length - Password length (default: 16)
     * @returns Generated password
     */
    generateSecurePassword(length?: number): string;
}
