/**
 * Password Use Case Implementation
 * Handles password management operations
 */

import { injectable, inject } from 'inversify';
import {
    ChangePasswordDto,
    PasswordResetRequestDto,
    PasswordResetConfirmDto,
    PasswordResponseDto,
} from '@/application/dto/password.dto.js';
import { PasswordUseCaseInterface } from '@/application/interface/password.use-case.interface.js';
import { TYPES } from '@/di/type.js';
import { IUserRepository } from '@/domain/reponsitory-interface/user.reponsitory.interface.js';
import { IPasswordHasher } from '@/domain/service-interface/password-hasher.interface.js';
import { IPasswordHistoryRepository } from '@/domain/reponsitory-interface/password-history.reponsitory.interface.js';
import { INotificationService } from '@/domain/service-interface/notification.interface.js';
import { IUserVerifyRepository } from '@/domain/reponsitory-interface/user-verify.reponsitory.interface.js';
import { TwoFactorEntity } from '@/domain/entity/twoFactor.entity.js';
import {
    UserError,
    ValidationError,
} from '@/domain/domain-error/error.js';
import { logger } from '@/shared/logger/index.js';
import { VERIFY_TYPE } from '@/generated/prisma/enums.js';

@injectable()
export class PasswordUseCase implements PasswordUseCaseInterface {
    private readonly MIN_PASSWORD_STRENGTH = 3;
    private readonly PASSWORD_HISTORY_LIMIT = 5;
    private readonly RESET_TOKEN_EXPIRY = 3600; // 1 hour

    constructor(
        @inject(TYPES.UserRepository) private userRepository: IUserRepository,
        @inject(TYPES.PasswordHasher) private passwordHasher: IPasswordHasher,
        @inject(TYPES.PasswordHistoryRepository) private passwordHistoryRepository: IPasswordHistoryRepository,
        @inject(TYPES.NotificationService) private notificationService: INotificationService,
        @inject(TYPES.UserVerifyRepository) private userVerifyRepository: IUserVerifyRepository,
    ) {}

    // ============================================================
    // Change Password
    // ============================================================

    async changePassword(userId: string, data: ChangePasswordDto): Promise<PasswordResponseDto> {
        logger.info('Change password attempt', { userId });

        // Validate passwords match
        if (data.newPassword !== data.confirmPassword) {
            throw UserError.PASSWORD_MISMATCH;
        }

        // Get user
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw UserError.NOT_FOUND;
        }

        // Verify old password
        const isValidOldPassword = await this.passwordHasher.verify(data.oldPassword, user.passwordHash);
        if (!isValidOldPassword) {
            throw UserError.INVALID_PASSWORD;
        }

        // Check if new password is same as old
        const isSamePassword = await this.passwordHasher.verify(data.newPassword, user.passwordHash);
        if (isSamePassword) {
            throw UserError.PASSWORD_SAME_AS_OLD;
        }

        // Validate password strength
        const strengthCheck = this.validatePasswordStrength(data.newPassword);
        if (!strengthCheck.isValid) {
            throw new ValidationError(
                'WEAK_PASSWORD',
                strengthCheck.feedback.join(', '),
                400,
            );
        }

        // Check password history
        const passwordHash = await this.passwordHasher.hash(data.newPassword);
        const isInHistory = await this.passwordHistoryRepository.isInHistory(userId, passwordHash, this.PASSWORD_HISTORY_LIMIT);
        if (isInHistory) {
            throw UserError.PASSWORD_RECENTLY_USED;
        }

        // Add current password to history
        await this.passwordHistoryRepository.add(userId, user.passwordHash, '127.0.0.1');

        // Update password
        await this.userRepository.updatePassword(userId, passwordHash);

        // Revoke all tokens for security
        await this.revokeAllUserTokens(userId);

        logger.info('Change password successful', { userId });

        return {
            message: 'Password changed successfully',
            success: true,
        };
    }

    // ============================================================
    // Request Password Reset
    // ============================================================

    async requestPasswordReset(data: PasswordResetRequestDto): Promise<PasswordResponseDto> {
        logger.info('Request password reset', { email: data.email });

        // Find user by email
        const user = await this.userRepository.findByEmail(data.email);
        if (!user) {
            // Don't reveal if email exists or not
            logger.warn('Password reset requested for non-existent email', { email: data.email });
            return {
                message: 'If the email exists, a reset link will be sent',
                success: true,
            };
        }

        // Generate reset token
        const resetToken = TwoFactorEntity.generateOTP(32);
        const tokenHash = await this.passwordHasher.hash(resetToken);

        // Store verification token
        await this.userVerifyRepository.createEmailToken(
            user.id,
            VERIFY_TYPE.PASSWORD_RESET,
            tokenHash,
            this.RESET_TOKEN_EXPIRY,
        );

        // Send reset email
        const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
        await this.notificationService.sendPasswordResetEmail(data.email, resetUrl, user.username);

        logger.info('Password reset email sent', { userId: user.id });

        return {
            message: 'If the email exists, a reset link will be sent',
            success: true,
        };
    }

    // ============================================================
    // Confirm Password Reset
    // ============================================================

    async confirmPasswordReset(data: PasswordResetConfirmDto): Promise<PasswordResponseDto> {
        logger.info('Confirm password reset');

        // Validate passwords match
        if (data.newPassword !== data.confirmPassword) {
            throw UserError.PASSWORD_MISMATCH;
        }

        // Validate password strength
        const strengthCheck = this.validatePasswordStrength(data.newPassword);
        if (!strengthCheck.isValid) {
            throw new ValidationError(
                'WEAK_PASSWORD',
                strengthCheck.feedback.join(', '),
                400,
            );
        }

        // Verify reset token
        const tokenHash = await this.passwordHasher.hash(data.token);
        const verification = await this.userVerifyRepository.findByToken(tokenHash);

        if (!verification || verification.isUsed) {
            throw new ValidationError('INVALID_TOKEN', 'Invalid or expired reset token', 400);
        }

        // Get user
        const user = await this.userRepository.findById(verification.userId);
        if (!user) {
            throw UserError.NOT_FOUND;
        }

        // Hash new password
        const passwordHash = await this.passwordHasher.hash(data.newPassword);

        // Check password history
        const isInHistory = await this.passwordHistoryRepository.isInHistory(user.id, passwordHash, this.PASSWORD_HISTORY_LIMIT);
        if (isInHistory) {
            throw UserError.PASSWORD_RECENTLY_USED;
        }

        // Add current password to history
        await this.passwordHistoryRepository.add(user.id, user.passwordHash, '127.0.0.1');

        // Update password
        await this.userRepository.updatePassword(user.id, passwordHash);

        // Mark verification as used
        await this.userVerifyRepository.markAsUsed(verification.id);

        // Revoke all tokens for security
        await this.revokeAllUserTokens(user.id);

        logger.info('Password reset successful', { userId: user.id });

        return {
            message: 'Password reset successfully',
            success: true,
        };
    }

    // ============================================================
    // Validate Reset Token
    // ============================================================

    async validateResetToken(token: string): Promise<boolean> {
        const tokenHash = await this.passwordHasher.hash(token);
        const verification = await this.userVerifyRepository.findByToken(tokenHash);
        return !!verification && !verification.isUsed && verification.expiresAt > new Date();
    }

    // ============================================================
    // Check Password in History
    // ============================================================

    async isPasswordInHistory(userId: string, newPassword: string): Promise<boolean> {
        const passwordHash = await this.passwordHasher.hash(newPassword);
        return this.passwordHistoryRepository.isInHistory(userId, passwordHash, this.PASSWORD_HISTORY_LIMIT);
    }

    // ============================================================
    // Add Password to History
    // ============================================================

    async addToPasswordHistory(userId: string, passwordHash: string): Promise<boolean> {
        await this.passwordHistoryRepository.add(userId, passwordHash, '127.0.0.1');
        return true;
    }

    // ============================================================
    // Cleanup Password History
    // ============================================================

    async cleanupPasswordHistory(userId: string, keepCount: number = this.PASSWORD_HISTORY_LIMIT): Promise<boolean> {
        await this.passwordHistoryRepository.cleanup(userId, keepCount);
        return true;
    }

    // ============================================================
    // Check if Password Change Required
    // ============================================================

    async requiresPasswordChange(userId: string): Promise<boolean> {
        const user = await this.userRepository.findById(userId);
        if (!user) return false;

        // Require change if password hasn't been changed in 90 days
        if (user.passwordChangedAt) {
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            return user.passwordChangedAt < ninetyDaysAgo;
        }

        // Or if account is older than 90 days and password was never changed
        const createdAt = new Date(user.createdAt);
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        return createdAt < ninetyDaysAgo;
    }

    // ============================================================
    // Set Password Change Required
    // ============================================================

    async setRequirePasswordChange(userId: string, required: boolean): Promise<boolean> {
        // This could be stored in user metadata or a separate table
        // For now, we'll just log it
        logger.info('Set require password change', { userId, required });
        return true;
    }

    // ============================================================
    // Validate Password Strength
    // ============================================================

    validatePasswordStrength(password: string): {
        isValid: boolean;
        score: number;
        feedback: string[];
    } {
        const feedback: string[] = [];
        let score = 0;

        // Length check
        if (password.length >= 8) {
            score += 1;
        } else {
            feedback.push('Password must be at least 8 characters');
        }

        // Uppercase check
        if (/[A-Z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Password must contain uppercase letters');
        }

        // Lowercase check
        if (/[a-z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Password must contain lowercase letters');
        }

        // Number check
        if (/\d/.test(password)) {
            score += 1;
        } else {
            feedback.push('Password must contain numbers');
        }

        // Special character check
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Password must contain special characters');
        }

        return {
            isValid: score >= this.MIN_PASSWORD_STRENGTH,
            score,
            feedback,
        };
    }

    // ============================================================
    // Generate Secure Password
    // ============================================================

    generateSecurePassword(length: number = 16): string {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const all = uppercase + lowercase + numbers + special;

        let password = '';

        // Ensure at least one of each type
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];

        // Fill the rest randomly
        for (let i = password.length; i < length; i++) {
            password += all[Math.floor(Math.random() * all.length)];
        }

        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    // ============================================================
    // Private Helper Methods
    // ============================================================

    private async revokeAllUserTokens(userId: string): Promise<void> {
        // This would be implemented via TokenUseCase
        logger.info('Revoke all user tokens for password change', { userId });
    }
}
