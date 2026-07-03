/**
 * User Verification Repository Implementation
 * Prisma-based implementation of IUserVerifyRepository
 */

import { injectable, inject } from 'inversify';
import { VERIFY_TYPE } from '@/generated/prisma/enums.js';
import { IUserVerifyRepository } from '@/domain/reponsitory-interface/user-verify.reponsitory.interface.js';
import { TYPES } from '@/di/type.js';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.js';

@injectable()
export class UserVerifyRepository implements IUserVerifyRepository {
    constructor(@inject(TYPES.PrismaService) private prisma: PrismaService) {}

    // ============================================================
    // Find Operations
    // ============================================================

    async findByToken(token: string): Promise<{
        id: string;
        userId: string;
        type: VERIFY_TYPE;
        token: string | null;
        otpHash: string | null;
        attempts: number;
        isUsed: boolean;
        expiresAt: Date;
        createdAt: Date;
        usedAt: Date | null;
    } | null> {
        const record = await this.prisma.client.userVerify.findUnique({
            where: { token },
        });
        if (!record) return null;
        return record;
    }

    async findByUserAndType(userId: string, type: VERIFY_TYPE): Promise<{
        id: string;
        userId: string;
        type: VERIFY_TYPE;
        token: string | null;
        otpHash: string | null;
        attempts: number;
        isUsed: boolean;
        expiresAt: Date;
        createdAt: Date;
        usedAt: Date | null;
    } | null> {
        const record = await this.prisma.client.userVerify.findFirst({
            where: { userId, type },
        });
        if (!record) return null;
        return record;
    }

    // ============================================================
    // Create Operations
    // ============================================================

    async createEmailToken(
        userId: string,
        type: VERIFY_TYPE,
        token: string,
        expiresIn: number
    ): Promise<string> {
        const expiresAt = new Date(Date.now() + expiresIn * 1000);
        const record = await this.prisma.client.userVerify.create({
            data: {
                id: crypto.randomUUID(),
                userId,
                type,
                token,
                otpHash: null,
                attempts: 0,
                isUsed: false,
                expiresAt,
            },
        });
        return record.id;
    }

    async createOTP(
        userId: string,
        type: VERIFY_TYPE,
        otpHash: string,
        expiresIn: number
    ): Promise<string> {
        const expiresAt = new Date(Date.now() + expiresIn * 1000);
        const record = await this.prisma.client.userVerify.create({
            data: {
                id: crypto.randomUUID(),
                userId,
                type,
                token: null,
                otpHash,
                attempts: 0,
                isUsed: false,
                expiresAt,
            },
        });
        return record.id;
    }

    // ============================================================
    // Update Operations
    // ============================================================

    async markAsUsed(id: string): Promise<boolean> {
        try {
            await this.prisma.client.userVerify.update({
                where: { id },
                data: {
                    isUsed: true,
                    usedAt: new Date(),
                },
            });
            return true;
        } catch {
            return false;
        }
    }

    async markAsUsedByToken(token: string): Promise<boolean> {
        try {
            await this.prisma.client.userVerify.updateMany({
                where: { token },
                data: {
                    isUsed: true,
                    usedAt: new Date(),
                },
            });
            return true;
        } catch {
            return false;
        }
    }

    async incrementAttempts(id: string): Promise<number> {
        const record = await this.prisma.client.userVerify.update({
            where: { id },
            data: { attempts: { increment: 1 } },
            select: { attempts: true },
        });
        return record.attempts;
    }

    async incrementAttemptsByToken(token: string): Promise<number> {
        const record = await this.prisma.client.userVerify.updateMany({
            where: { token },
            data: { attempts: { increment: 1 } },
        });
        return record.count > 0 ? record.count : 0;
    }

    // ============================================================
    // Delete Operations
    // ============================================================

    async delete(id: string): Promise<boolean> {
        try {
            await this.prisma.client.userVerify.delete({ where: { id } });
            return true;
        } catch {
            return false;
        }
    }

    async deleteByToken(token: string): Promise<boolean> {
        try {
            await this.prisma.client.userVerify.deleteMany({ where: { token } });
            return true;
        } catch {
            return false;
        }
    }

    async deleteByUserAndType(userId: string, type: VERIFY_TYPE): Promise<number> {
        const result = await this.prisma.client.userVerify.deleteMany({
            where: { userId, type },
        });
        return result.count;
    }

    async deleteExpired(): Promise<number> {
        const result = await this.prisma.client.userVerify.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
        return result.count;
    }

    async deleteUsedOlderThan(date: Date): Promise<number> {
        const result = await this.prisma.client.userVerify.deleteMany({
            where: {
                isUsed: true,
                usedAt: { lt: date },
            },
        });
        return result.count;
    }

    // ============================================================
    // Validation Operations
    // ============================================================

    async getRemainingAttempts(token: string): Promise<number> {
        const record = await this.prisma.client.userVerify.findUnique({
            where: { token },
            select: { attempts: true },
        });
        if (!record) return 0;
        return Math.max(0, 5 - record.attempts); // Max 5 attempts
    }

    async isTokenValid(token: string): Promise<boolean> {
        const record = await this.prisma.client.userVerify.findUnique({
            where: { token },
        });
        if (!record) return false;
        return !record.isUsed && record.expiresAt > new Date() && record.attempts < 5;
    }

    async isOTPValid(userId: string, otpHash: string, type: VERIFY_TYPE): Promise<boolean> {
        const record = await this.prisma.client.userVerify.findFirst({
            where: { userId, type },
        });
        if (!record) return false;
        return record.otpHash === otpHash && !record.isUsed && record.expiresAt > new Date();
    }

    // ============================================================
    // Query Operations
    // ============================================================

    async findPendingByUser(userId: string): Promise<Array<{
        id: string;
        type: VERIFY_TYPE;
        expiresAt: Date;
        attempts: number;
    }>> {
        const records = await this.prisma.client.userVerify.findMany({
            where: {
                userId,
                isUsed: false,
                expiresAt: { gt: new Date() },
            },
            select: {
                id: true,
                type: true,
                expiresAt: true,
                attempts: true,
            },
        });
        return records;
    }

    async cleanup(olderThanDays: number): Promise<number> {
        const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
        const result = await this.prisma.client.userVerify.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: cutoffDate } },
                    { isUsed: true, usedAt: { lt: cutoffDate } },
                ],
            },
        });
        return result.count;
    }
}
