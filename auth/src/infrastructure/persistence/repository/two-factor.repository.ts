/**
 * Two-Factor Authentication Repository Implementation
 * Prisma-based implementation of ITwoFactorRepository
 */

import { injectable, inject } from 'inversify';
import { TwoFactor, TwoFactorType, type TwoFactorProps, type CreateTwoFactorData } from '@/domain/entity/twoFactor.entity.js';
import { ITwoFactorRepository } from '@/domain/reponsitory-interface/two-factor.reponsitory.interface.js';
import { TYPES } from '@/di/type.js';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.js';

@injectable()
export class TwoFactorRepository implements ITwoFactorRepository {
    constructor(@inject(TYPES.PrismaService) private prisma: PrismaService) {}

    // ============================================================
    // CRUD Operations
    // ============================================================

    async findByUserId(userId: string): Promise<TwoFactor | null> {
        const record = await this.prisma.client.twoFactor.findUnique({
            where: { userId },
        });
        if (!record) return null;
        return TwoFactor.fromPersistence(this.mapToEntity(record));
    }

    async create(data: CreateTwoFactorData): Promise<TwoFactor> {
        const record = await this.prisma.client.twoFactor.create({
            data: {
                id: crypto.randomUUID(),
                userId: data.userId,
                type: this.mapTypeToPrisma(data.type),
                secret: data.secret,
                backupCodes: data.backupCodes || [],
                isEnabled: false,
                isVerified: false,
                enabledAt: null,
            },
        });
        return TwoFactor.fromPersistence(this.mapToEntity(record));
    }

    async update(id: string, data: Partial<TwoFactorProps>): Promise<TwoFactor | null> {
        try {
            const record = await this.prisma.client.twoFactor.update({
                where: { id },
                data: {
                    ...(data.secret !== undefined && { secret: data.secret }),
                    ...(data.backupCodes !== undefined && { backupCodes: data.backupCodes }),
                    ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
                    ...(data.isVerified !== undefined && { isVerified: data.isVerified }),
                    ...(data.enabledAt !== undefined && { enabledAt: data.enabledAt }),
                },
            });
            return TwoFactor.fromPersistence(this.mapToEntity(record));
        } catch {
            return null;
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            await this.prisma.client.twoFactor.delete({ where: { id } });
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================
    // Enable/Disable Operations
    // ============================================================

    async enable(userId: string): Promise<boolean> {
        try {
            const twoFactor = await this.findByUserId(userId);
            if (!twoFactor) return false;

            await this.update(twoFactor.id, {
                isEnabled: true,
                isVerified: true,
                enabledAt: new Date(),
            });
            return true;
        } catch {
            return false;
        }
    }

    async disable(userId: string): Promise<boolean> {
        try {
            const twoFactor = await this.findByUserId(userId);
            if (!twoFactor) return false;

            await this.update(twoFactor.id, {
                isEnabled: false,
                isVerified: false,
                enabledAt: null,
                secret: null,
                backupCodes: [],
            });
            return true;
        } catch {
            return false;
        }
    }

    async verifySetup(userId: string): Promise<boolean> {
        try {
            const twoFactor = await this.findByUserId(userId);
            if (!twoFactor) return false;

            await this.update(twoFactor.id, { isVerified: true });
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================
    // Secret & Backup Codes Operations
    // ============================================================

    async updateSecret(userId: string, secret: string): Promise<boolean> {
        try {
            const twoFactor = await this.findByUserId(userId);
            if (!twoFactor) return false;

            await this.update(twoFactor.id, { secret });
            return true;
        } catch {
            return false;
        }
    }

    async updateBackupCodes(userId: string, codes: string[]): Promise<boolean> {
        try {
            const twoFactor = await this.findByUserId(userId);
            if (!twoFactor) return false;

            await this.update(twoFactor.id, { backupCodes: codes });
            return true;
        } catch {
            return false;
        }
    }

    async useBackupCode(userId: string, code: string): Promise<boolean> {
        try {
            const twoFactor = await this.findByUserId(userId);
            if (!twoFactor) return false;

            const remainingCodes = twoFactor.backupCodes.filter(c => c !== code);
            await this.update(twoFactor.id, { backupCodes: remainingCodes });
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================
    // Query Operations
    // ============================================================

    async isEnabled(userId: string): Promise<boolean> {
        const record = await this.prisma.client.twoFactor.findUnique({
            where: { userId },
            select: { isEnabled: true, isVerified: true },
        });
        return record?.isEnabled === true && record?.isVerified === true;
    }

    async getBackupCodesCount(userId: string): Promise<number> {
        const record = await this.prisma.client.twoFactor.findUnique({
            where: { userId },
            select: { backupCodes: true },
        });
        if (!record) return 0;

        // Parse backupCodes if stored as JSON string
        const codes = Array.isArray(record.backupCodes)
            ? record.backupCodes
            : JSON.parse(record.backupCodes || '[]');
        return codes.length;
    }

    async findEnabled(): Promise<TwoFactor[]> {
        const records = await this.prisma.client.twoFactor.findMany({
            where: { isEnabled: true, isVerified: true },
        });
        return records.map(r => TwoFactor.fromPersistence(this.mapToEntity(r)));
    }

    async deleteByUserId(userId: string): Promise<boolean> {
        try {
            await this.prisma.client.twoFactor.delete({ where: { userId } });
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================
    // Private Helper Methods
    // ============================================================

    private mapToEntity(record: any): TwoFactorProps {
        return {
            id: record.id,
            userId: record.userId,
            type: this.mapPrismaTypeToDomain(record.type),
            secret: record.secret,
            backupCodes: Array.isArray(record.backupCodes)
                ? record.backupCodes
                : JSON.parse(record.backupCodes || '[]'),
            isEnabled: record.isEnabled,
            isVerified: record.isVerified,
            enabledAt: record.enabledAt,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }

    private mapTypeToPrisma(type: TwoFactorType): string {
        switch (type) {
            case TwoFactorType.TOTP:
                return 'TOTP';
            case TwoFactorType.SMS:
                return 'SMS_OTP';
            case TwoFactorType.EMAIL:
                return 'EMAIL_OTP';
            case TwoFactorType.BACKUP:
                return 'BACKUP';
            default:
                return 'TOTP';
        }
    }

    private mapPrismaTypeToDomain(type: string): TwoFactorType {
        switch (type) {
            case 'TOTP':
                return TwoFactorType.TOTP;
            case 'SMS_OTP':
                return TwoFactorType.SMS;
            case 'EMAIL_OTP':
                return TwoFactorType.EMAIL;
            case 'BACKUP':
                return TwoFactorType.BACKUP;
            default:
                return TwoFactorType.TOTP;
        }
    }
}
