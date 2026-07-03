/**
 * Verification Use Case Implementation
 * TODO: Implement full verification logic
 */

import { injectable, inject } from 'inversify';
import { VerifyEmailDto, ResendVerificationDto } from '@/application/dto/verify-email.dto.js';
import {
    VerifyUseCaseInterface,
    VerifyType,
    VerifyMethod,
    type VerificationStatus,
} from '@/application/interface/verify.use-case.interface.js';
import { TYPES } from '@/di/type.js';
import { IUserVerifyRepository } from '@/domain/reponsitory-interface/user-verify.reponsitory.interface.js';
import { IUserRepository } from '@/domain/reponsitory-interface/user.reponsitory.interface.js';
import { INotificationService } from '@/domain/service-interface/notification.interface.js';
import { IPasswordHasher } from '@/domain/service-interface/password-hasher.interface.js';
import { TwoFactorEntity } from '@/domain/entity/twoFactor.entity.js';
import { VerificationError, UserError } from '@/domain/domain-error/error.js';
import { logger } from '@/shared/logger/index.js';
import { VERIFY_TYPE as PrismaVerifyType } from '@/generated/prisma/enums.js';

@injectable()
export class VerifyUseCase implements VerifyUseCaseInterface {
    constructor(
        @inject(TYPES.UserVerifyRepository) private userVerifyRepository: IUserVerifyRepository,
        @inject(TYPES.UserRepository) private userRepository: IUserRepository,
        @inject(TYPES.NotificationService) private notificationService: INotificationService,
        @inject(TYPES.PasswordHasher) private passwordHasher: IPasswordHasher,
    ) {}

    async verifyEmail(data: VerifyEmailDto): Promise<boolean> {
        logger.info('Verify email', { token: data.token.substring(0, 10) + '...' });

        // Hash token and find verification
        const tokenHash = await this.passwordHasher.hash(data.token);
        const verification = await this.userVerifyRepository.findByToken(tokenHash);

        if (!verification) {
            throw VerificationError.INVALID_TOKEN;
        }

        if (verification.isUsed) {
            throw VerificationError.TOKEN_USED;
        }

        if (verification.expiresAt < new Date()) {
            throw VerificationError.EXPIRED_TOKEN;
        }

        // Check attempts
        const remaining = 5 - verification.attempts;
        if (remaining <= 0) {
            throw VerificationError.TOO_MANY_ATTEMPTS;
        }

        // Mark as used
        await this.userVerifyRepository.markAsUsed(verification.id);

        // Mark user as verified
        await this.userRepository.markAsVerified(verification.userId);

        logger.info('Email verified', { userId: verification.userId });

        return true;
    }

    async resendVerificationEmail(data: ResendVerificationDto): Promise<boolean> {
        logger.info('Resend verification email', { email: data.email });

        // Find user by email
        const user = await this.userRepository.findByEmail(data.email);
        if (!user) {
            // Don't reveal if email exists
            return true;
        }

        // Check if already verified
        if (user.isVerified()) {
            throw VerificationError.ALREADY_VERIFIED;
        }

        // Generate new verification token
        const token = TwoFactorEntity.generateRandomCode(32);
        const tokenHash = await this.passwordHasher.hash(token);

        // Store verification
        await this.userVerifyRepository.createEmailToken(
            user.id,
            PrismaVerifyType.EMAIL_REGISTER,
            tokenHash,
            86400, // 24 hours
        );

        // Send verification email
        const verifyUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
        await this.notificationService.sendVerificationEmail(data.email, verifyUrl, user.username);

        logger.info('Verification email resent', { userId: user.id });

        return true;
    }

    async verifyPhone(userId: string, code: string): Promise<boolean> {
        logger.info('Verify phone', { userId });

        const verification = await this.userVerifyRepository.findByUserAndType(
            userId,
            PrismaVerifyType.PHONE_REGISTER,
        );

        if (!verification) {
            throw VerificationError.NOT_FOUND;
        }

        if (verification.isUsed) {
            throw VerificationError.TOKEN_USED;
        }

        // Verify OTP
        const otpHash = verification.otpHash || '';
        const isValid = await this.passwordHasher.verify(code, otpHash);

        if (!isValid) {
            await this.userVerifyRepository.incrementAttempts(verification.id);
            throw VerificationError.INVALID_TOKEN;
        }

        await this.userVerifyRepository.markAsUsed(verification.id);

        logger.info('Phone verified', { userId });

        return true;
    }

    async sendPhoneVerification(userId: string, phone: string): Promise<boolean> {
        logger.info('Send phone verification', { userId, phone });

        // Generate OTP
        const otp = TwoFactorEntity.generateOTP(6);
        const otpHash = await this.passwordHasher.hash(otp);

        // Store OTP verification
        await this.userVerifyRepository.createOTP(
            userId,
            PrismaVerifyType.PHONE_REGISTER,
            otpHash,
            300, // 5 minutes
        );

        // Send SMS
        await this.notificationService.sendVerificationSMS(phone, otp);

        logger.info('Phone verification sent', { userId });

        return true;
    }

    async createVerification(userId: string, type: VerifyType, expiresIn: number = 3600): Promise<string> {
        logger.info('Create verification', { userId, type });

        const token = TwoFactorEntity.generateRandomCode(32);
        const tokenHash = await this.passwordHasher.hash(token);

        await this.userVerifyRepository.createEmailToken(userId, type as PrismaVerifyType, tokenHash, expiresIn);

        return token;
    }

    async createOTP(userId: string, type: VerifyType, expiresIn: number = 300): Promise<string> {
        logger.info('Create OTP', { userId, type });

        const otp = TwoFactorEntity.generateOTP(6);
        const otpHash = await this.passwordHasher.hash(otp);

        await this.userVerifyRepository.createOTP(userId, type as PrismaVerifyType, otpHash, expiresIn);

        return otp;
    }

    async verifyToken(token: string, type: VerifyType): Promise<boolean> {
        const tokenHash = await this.passwordHasher.hash(token);
        const verification = await this.userVerifyRepository.findByToken(tokenHash);

        if (!verification || verification.type !== type) {
            return false;
        }

        if (verification.isUsed || verification.expiresAt < new Date()) {
            return false;
        }

        await this.userVerifyRepository.markAsUsed(verification.id);

        return true;
    }

    async verifyOTP(userId: string, code: string, type: VerifyType): Promise<boolean> {
        const verification = await this.userVerifyRepository.findByUserAndType(userId, type as PrismaVerifyType);

        if (!verification) {
            return false;
        }

        const otpHash = verification.otpHash || '';
        const isValid = await this.passwordHasher.verify(code, otpHash);

        if (!isValid) {
            await this.userVerifyRepository.incrementAttempts(verification.id);
            return false;
        }

        await this.userVerifyRepository.markAsUsed(verification.id);

        return true;
    }

    async getVerificationStatus(userId: string, type: VerifyType): Promise<VerificationStatus | null> {
        const verification = await this.userVerifyRepository.findByUserAndType(userId, type as PrismaVerifyType);

        if (!verification) {
            return null;
        }

        return {
            isVerified: verification.isUsed,
            type: type,
            expiresAt: verification.expiresAt,
            attemptsRemaining: 5 - verification.attempts,
        };
    }

    async invalidateVerification(token: string): Promise<boolean> {
        const tokenHash = await this.passwordHasher.hash(token);
        return this.userVerifyRepository.deleteByToken(tokenHash);
    }

    async cleanupExpiredVerifications(): Promise<number> {
        return this.userVerifyRepository.deleteExpired();
    }

    async getRemainingAttempts(token: string): Promise<number> {
        const tokenHash = await this.passwordHasher.hash(token);
        return this.userVerifyRepository.getRemainingAttempts(tokenHash);
    }

    async incrementFailedAttempt(token: string): Promise<number> {
        const tokenHash = await this.passwordHasher.hash(token);
        return this.userVerifyRepository.incrementAttemptsByToken(tokenHash);
    }

    async isUserVerified(userId: string, type: VerifyType): Promise<boolean> {
        const user = await this.userRepository.findById(userId);
        if (!user) return false;

        if (type === VerifyType.EMAIL_REGISTER || type === VerifyType.EMAIL_CHANGE) {
            return user.isVerified();
        }

        // For other types, check verification records
        const verification = await this.userVerifyRepository.findByUserAndType(userId, type as PrismaVerifyType);
        return verification?.isUsed || false;
    }

    async markUserAsVerified(userId: string, type: VerifyType): Promise<boolean> {
        if (type === VerifyType.EMAIL_REGISTER) {
            return this.userRepository.markAsVerified(userId);
        }

        // For other types, mark verification as used
        const verification = await this.userVerifyRepository.findByUserAndType(userId, type as PrismaVerifyType);
        if (verification) {
            await this.userVerifyRepository.markAsUsed(verification.id);
        }

        return true;
    }
}
