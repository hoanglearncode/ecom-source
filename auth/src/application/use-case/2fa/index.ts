/**
 * Two-Factor Authentication Use Case Implementation
 * TODO: Implement full 2FA logic with TOTP library
 */

import { injectable, inject } from 'inversify';
import {
    Enable2FADto,
    Enable2FAResponseDto,
    Verify2FADto,
    Disable2FADto,
} from '@/application/dto/two-factor.dto.js';
import { TwoFactorUseCaseInterface, TwoFactorType, type TwoFactorStatus } from '@/application/interface/two-factor.use-case.interface.js';
import { TYPES } from '@/di/type.js';
import { ITwoFactorRepository } from '@/domain/reponsitory-interface/two-factor.reponsitory.interface.js';
import { IPasswordHasher } from '@/domain/service-interface/password-hasher.interface.js';
import { IUserRepository } from '@/domain/reponsitory-interface/user.reponsitory.interface.js';
import { TwoFactorEntity } from '@/domain/entity/twoFactor.entity.js';
import { TwoFactorError, UserError } from '@/domain/domain-error/error.js';
import { logger } from '@/shared/logger/index.js';

@injectable()
export class TwoFactorUseCase implements TwoFactorUseCaseInterface {
    constructor(
        @inject(TYPES.TwoFactorRepository) private twoFactorRepository: ITwoFactorRepository,
        @inject(TYPES.PasswordHasher) private passwordHasher: IPasswordHasher,
        @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    ) {}

    async enable2FA(userId: string, data: Enable2FADto): Promise<Enable2FAResponseDto> {
        logger.info('Enable 2FA attempt', { userId });

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw UserError.NOT_FOUND;
        }

        // Verify password
        const isValidPassword = await this.passwordHasher.verify(data.password, user.passwordHash);
        if (!isValidPassword) {
            throw UserError.INVALID_PASSWORD;
        }

        // Check if already enabled
        const existing = await this.twoFactorRepository.findByUserId(userId);
        if (existing && existing.isEnabled) {
            throw TwoFactorError.ALREADY_ENABLED;
        }

        // Generate TOTP secret
        const secret = TwoFactorEntity.generateTOTPSecret();
        const backupCodes = TwoFactorEntity.generateBackupCodes(10);

        // Store (not verified yet)
        if (existing) {
            await this.twoFactorRepository.updateSecret(userId, secret);
            await this.twoFactorRepository.updateBackupCodes(userId, backupCodes);
        } else {
            await this.twoFactorRepository.create({
                userId,
                type: TwoFactorType.TOTP,
                secret,
                backupCodes,
            });
        }

        // Generate QR code URI
        const qrCodeUri = TwoFactorEntity.generateTOTPUri(
            'E-Commerce',
            user.username,
            secret,
            'E-Commerce',
        );

        logger.info('2FA enabled (pending verification)', { userId });

        return {
            qrCode: qrCodeUri,
            backupCodes,
            message: '2FA setup initiated. Please verify with your authenticator app.',
        };
    }

    async verify2FASetup(userId: string, token: string): Promise<boolean> {
        logger.info('Verify 2FA setup', { userId });

        const twoFactor = await this.twoFactorRepository.findByUserId(userId);
        if (!twoFactor) {
            throw TwoFactorError.NOT_ENABLED;
        }

        // Verify TOTP token
        const isValid = await TwoFactorEntity.verifyTOTP(token, twoFactor.secret || '');
        if (!isValid) {
            throw TwoFactorError.INVALID_CODE;
        }

        // Enable 2FA
        await this.twoFactorRepository.enable(userId);

        logger.info('2FA verified and enabled', { userId });

        return true;
    }

    async verify2FALogin(userId: string, data: Verify2FADto): Promise<boolean> {
        logger.info('Verify 2FA login', { userId });

        const twoFactor = await this.twoFactorRepository.findByUserId(userId);
        if (!twoFactor || !twoFactor.isEnabled) {
            throw TwoFactorError.NOT_ENABLED;
        }

        // Check if it's a backup code
        const isBackupCode = TwoFactorEntity.isValidBackupCode(data.token);
        if (isBackupCode) {
            const used = await this.twoFactorRepository.useBackupCode(userId, data.token);
            if (!used) {
                throw TwoFactorError.BACKUP_CODE_USED;
            }
            logger.info('Backup code used for login', { userId });
            return true;
        }

        // Verify TOTP token
        const isValid = await TwoFactorEntity.verifyTOTP(data.token, twoFactor.secret || '');
        if (!isValid) {
            throw TwoFactorError.INVALID_CODE;
        }

        logger.info('2FA login verified', { userId });

        return true;
    }

    async disable2FA(userId: string, data: Disable2FADto): Promise<boolean> {
        logger.info('Disable 2FA', { userId });

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw UserError.NOT_FOUND;
        }

        // Verify password
        const isValidPassword = await this.passwordHasher.verify(data.password, user.passwordHash);
        if (!isValidPassword) {
            throw UserError.INVALID_PASSWORD;
        }

        // Verify 2FA token
        const twoFactor = await this.twoFactorRepository.findByUserId(userId);
        if (!twoFactor || !twoFactor.isEnabled) {
            throw TwoFactorError.NOT_ENABLED;
        }

        const isValidToken = await TwoFactorEntity.verifyTOTP(data.token, twoFactor.secret || '');
        if (!isValidToken) {
            throw TwoFactorError.INVALID_CODE;
        }

        // Disable 2FA
        await this.twoFactorRepository.disable(userId);

        logger.info('2FA disabled', { userId });

        return true;
    }

    async regenerateBackupCodes(userId: string, password: string): Promise<string[]> {
        logger.info('Regenerate backup codes', { userId });

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw UserError.NOT_FOUND;
        }

        // Verify password
        const isValidPassword = await this.passwordHasher.verify(password, user.passwordHash);
        if (!isValidPassword) {
            throw UserError.INVALID_PASSWORD;
        }

        // Generate new backup codes
        const backupCodes = TwoFactorEntity.generateBackupCodes(10);
        await this.twoFactorRepository.updateBackupCodes(userId, backupCodes);

        logger.info('Backup codes regenerated', { userId });

        return backupCodes;
    }

    async useBackupCode(userId: string, code: string): Promise<boolean> {
        return this.twoFactorRepository.useBackupCode(userId, code);
    }

    async get2FAStatus(userId: string): Promise<TwoFactorStatus> {
        const twoFactor = await this.twoFactorRepository.findByUserId(userId);
        if (!twoFactor) {
            return {
                isEnabled: false,
                isVerified: false,
                type: TwoFactorType.TOTP,
                hasBackupCodes: false,
                backupCodesRemaining: 0,
            };
        }

        return {
            isEnabled: twoFactor.isEnabled,
            isVerified: twoFactor.isVerified,
            type: twoFactor.type as TwoFactorType,
            hasBackupCodes: twoFactor.backupCodes.length > 0,
            backupCodesRemaining: twoFactor.backupCodes.length,
        };
    }

    async sendSMSOTP(userId: string, phone: string): Promise<boolean> {
        // TODO: Implement SMS OTP sending
        logger.info('Send SMS OTP', { userId, phone });
        return true;
    }

    async sendEmailOTP(userId: string, email: string): Promise<boolean> {
        // TODO: Implement Email OTP sending
        logger.info('Send Email OTP', { userId, email });
        return true;
    }

    async verifyOTP(userId: string, code: string, type: 'SMS' | 'EMAIL'): Promise<boolean> {
        // TODO: Implement OTP verification
        logger.info('Verify OTP', { userId, type });
        return TwoFactorEntity.isValidOTP(code);
    }

    async is2FAEnabled(userId: string): Promise<boolean> {
        return this.twoFactorRepository.isEnabled(userId);
    }

    async getBackupCodesCount(userId: string): Promise<number> {
        return this.twoFactorRepository.getBackupCodesCount(userId);
    }

    async validateTOTPToken(userId: string, token: string): Promise<boolean> {
        const twoFactor = await this.twoFactorRepository.findByUserId(userId);
        if (!twoFactor || !twoFactor.secret) {
            return false;
        }
        return TwoFactorEntity.verifyTOTP(token, twoFactor.secret);
    }
}
