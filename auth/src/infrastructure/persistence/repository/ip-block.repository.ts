/**
 * IP Block Repository Implementation
 * Prisma-based implementation of IIpBlockRepository
 */

import { injectable, inject } from 'inversify';
import { BLACKLIST_REASON } from '@/generated/prisma/enums.js';
import { IIpBlockRepository } from '@/domain/reponsitory-interface/ip-block.reponsitory.interface.js';
import { TYPES } from '@/di/type.js';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.js';

@injectable()
export class IpBlockRepository implements IIpBlockRepository {
    constructor(@inject(TYPES.PrismaService) private prisma: PrismaService) {}

    // ============================================================
    // Find Operations
    // ============================================================

    async findByIP(ipAddress: string): Promise<{
        id: string;
        ipAddress: string;
        reason: string;
        attemptCount: number;
        isPermanent: boolean;
        blockedUntil: Date | null;
        createdAt: Date;
        updatedAt: Date;
    } | null> {
        const record = await this.prisma.client.ipBlock.findUnique({
            where: { ipAddress },
        });
        if (!record) return null;

        return {
            id: record.id,
            ipAddress: record.ipAddress,
            reason: record.reason,
            attemptCount: record.attemptCount,
            isPermanent: record.isPermanent,
            blockedUntil: record.blockedUntil,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }

    async isBlocked(ipAddress: string): Promise<boolean> {
        const record = await this.prisma.client.ipBlock.findUnique({
            where: { ipAddress },
        });

        if (!record) return false;

        // Check permanent block
        if (record.isPermanent) return true;

        // Check temporary block
        if (record.blockedUntil && record.blockedUntil > new Date()) return true;

        return false;
    }

    // ============================================================
    // Block Operations
    // ============================================================

    async blockTemporary(ipAddress: string, reason: string, durationMinutes: number): Promise<void> {
        const blockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

        await this.prisma.client.ipBlock.upsert({
            where: { ipAddress },
            create: {
                id: crypto.randomUUID(),
                ipAddress,
                reason,
                attemptCount: 1,
                isPermanent: false,
                blockedUntil,
            },
            update: {
                reason,
                blockedUntil,
                updatedAt: new Date(),
            },
        });
    }

    async blockPermanent(ipAddress: string, reason: string): Promise<void> {
        await this.prisma.client.ipBlock.upsert({
            where: { ipAddress },
            create: {
                id: crypto.randomUUID(),
                ipAddress,
                reason,
                attemptCount: 1,
                isPermanent: true,
                blockedUntil: null,
            },
            update: {
                reason,
                isPermanent: true,
                blockedUntil: null,
                updatedAt: new Date(),
            },
        });
    }

    async block(ipAddress: string, reason: BLACKLIST_REASON, durationMinutes?: number | null): Promise<void> {
        if (durationMinutes === null) {
            await this.blockPermanent(ipAddress, reason);
        } else {
            await this.blockTemporary(ipAddress, reason, durationMinutes || 15);
        }
    }

    async unblock(ipAddress: string): Promise<boolean> {
        try {
            await this.prisma.client.ipBlock.delete({
                where: { ipAddress },
            });
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================
    // Attempt Count Operations
    // ============================================================

    async incrementAttempts(ipAddress: string): Promise<number> {
        const record = await this.prisma.client.ipBlock.upsert({
            where: { ipAddress },
            create: {
                id: crypto.randomUUID(),
                ipAddress,
                reason: 'RATE_LIMIT',
                attemptCount: 1,
                isPermanent: false,
                blockedUntil: null,
            },
            update: {
                attemptCount: { increment: 1 },
                updatedAt: new Date(),
            },
        });
        return record.attemptCount;
    }

    async resetAttempts(ipAddress: string): Promise<boolean> {
        try {
            await this.prisma.client.ipBlock.update({
                where: { ipAddress },
                data: { attemptCount: 0 },
            });
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================
    // Query Operations
    // ============================================================

    async getAllBlocked(): Promise<Array<{
        ipAddress: string;
        reason: string;
        attemptCount: number;
        isPermanent: boolean;
        blockedUntil: Date | null;
        createdAt: Date;
    }>> {
        const records = await this.prisma.client.ipBlock.findMany({
            where: {
                OR: [
                    { isPermanent: true },
                    { blockedUntil: { gt: new Date() } },
                ],
            },
            select: {
                ipAddress: true,
                reason: true,
                attemptCount: true,
                isPermanent: true,
                blockedUntil: true,
                createdAt: true,
            },
        });
        return records;
    }

    async getTemporaryBlocked(): Promise<Array<{
        ipAddress: string;
        blockedUntil: Date;
        reason: string;
    }>> {
        const records = await this.prisma.client.ipBlock.findMany({
            where: {
                isPermanent: false,
                blockedUntil: { gt: new Date() },
            },
            select: {
                ipAddress: true,
                blockedUntil: true,
                reason: true,
            },
        });
        return records;
    }

    async getPermanentBlocked(): Promise<Array<{
        ipAddress: string;
        reason: string;
        createdAt: Date;
    }>> {
        const records = await this.prisma.client.ipBlock.findMany({
            where: { isPermanent: true },
            select: {
                ipAddress: true,
                reason: true,
                createdAt: true,
            },
        });
        return records;
    }

    async getBlockReason(ipAddress: string): Promise<string | null> {
        const record = await this.prisma.client.ipBlock.findUnique({
            where: { ipAddress },
            select: { reason: true },
        });
        return record?.reason || null;
    }

    async getRemainingBlockTime(ipAddress: string): Promise<number> {
        const record = await this.prisma.client.ipBlock.findUnique({
            where: { ipAddress },
        });

        if (!record) return 0;
        if (record.isPermanent) return -1; // Permanent block

        if (record.blockedUntil && record.blockedUntil > new Date()) {
            const now = Math.floor(Date.now() / 1000);
            const expiresAt = Math.floor(record.blockedUntil.getTime() / 1000);
            return Math.max(0, expiresAt - now);
        }

        return 0;
    }

    async findOrCreate(ipAddress: string): Promise<{
        id: string;
        ipAddress: string;
        reason: string;
        attemptCount: number;
        isPermanent: boolean;
        blockedUntil: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }> {
        const record = await this.prisma.client.ipBlock.upsert({
            where: { ipAddress },
            create: {
                id: crypto.randomUUID(),
                ipAddress,
                reason: '',
                attemptCount: 0,
                isPermanent: false,
                blockedUntil: null,
            },
            update: {},
        });

        return {
            id: record.id,
            ipAddress: record.ipAddress,
            reason: record.reason,
            attemptCount: record.attemptCount,
            isPermanent: record.isPermanent,
            blockedUntil: record.blockedUntil,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }

    // ============================================================
    // Statistics Operations
    // ============================================================

    async getStatistics(): Promise<{
        total: number;
        permanent: number;
        temporary: number;
    }> {
        const [total, permanent, temporary] = await Promise.all([
            this.prisma.client.ipBlock.count({
                where: {
                    OR: [
                        { isPermanent: true },
                        { blockedUntil: { gt: new Date() } },
                    ],
                },
            }),
            this.prisma.client.ipBlock.count({
                where: { isPermanent: true },
            }),
            this.prisma.client.ipBlock.count({
                where: {
                    isPermanent: false,
                    blockedUntil: { gt: new Date() },
                },
            }),
        ]);

        return { total, permanent, temporary };
    }

    // ============================================================
    // Cleanup Operations
    // ============================================================

    async deleteExpired(): Promise<number> {
        const result = await this.prisma.client.ipBlock.deleteMany({
            where: {
                isPermanent: false,
                blockedUntil: { lt: new Date() },
            },
        });
        return result.count;
    }

    async getOlderThan(date: Date): Promise<Array<{
        id: string;
        ipAddress: string;
        reason: string;
        createdAt: Date;
    }>> {
        const records = await this.prisma.client.ipBlock.findMany({
            where: { createdAt: { lt: date } },
            select: {
                id: true,
                ipAddress: true,
                reason: true,
                createdAt: true,
            },
        });
        return records;
    }

    async cleanup(olderThanDays: number): Promise<number> {
        const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

        // Delete old temporary blocks that have expired
        const result = await this.prisma.client.ipBlock.deleteMany({
            where: {
                isPermanent: false,
                OR: [
                    { createdAt: { lt: cutoffDate } },
                    { blockedUntil: { lt: new Date() } },
                ],
            },
        });
        return result.count;
    }
}
