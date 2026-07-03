/**
 * Password History Repository Implementation
 * Prisma-based implementation of IPasswordHistoryRepository
 */

import { injectable, inject } from 'inversify';
import { IPasswordHistoryRepository } from '@/domain/reponsitory-interface/password-history.reponsitory.interface.js';
import { TYPES } from '@/di/type.js';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.js';

@injectable()
export class PasswordHistoryRepository implements IPasswordHistoryRepository {
    constructor(@inject(TYPES.PrismaService) private prisma: PrismaService) {}

    // ============================================================
    // Add Operations
    // ============================================================

    async add(userId: string, passwordHash: string, ipAddress?: string): Promise<string> {
        const record = await this.prisma.client.passwordHistory.create({
            data: {
                id: crypto.randomUUID(),
                userId,
                passwordHash,
                ipAddress: ipAddress || null,
            },
        });
        return record.id;
    }

    // ============================================================
    // Get Operations
    // ============================================================

    async getByUserId(userId: string, limit: number = 10): Promise<Array<{
        id: string;
        userId: string;
        passwordHash: string;
        ipAddress: string | null;
        createdAt: Date;
    }>> {
        const records = await this.prisma.client.passwordHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return records;
    }

    async count(userId: string): Promise<number> {
        return this.prisma.client.passwordHistory.count({
            where: { userId },
        });
    }

    async getLastChangeDate(userId: string): Promise<Date | null> {
        const record = await this.prisma.client.passwordHistory.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
        });
        return record?.createdAt || null;
    }

    async getRecent(userId: string, count: number): Promise<string[]> {
        const records = await this.prisma.client.passwordHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: count,
            select: { passwordHash: true },
        });
        return records.map(r => r.passwordHash);
    }

    // ============================================================
    // Check Operations
    // ============================================================

    async isInHistory(userId: string, passwordHash: string, limit: number = 5): Promise<boolean> {
        const record = await this.prisma.client.passwordHistory.findFirst({
            where: {
                userId,
                passwordHash,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return !!record;
    }

    // ============================================================
    // Delete/Cleanup Operations
    // ============================================================

    async cleanup(userId: string, keepCount: number): Promise<number> {
        // Get total count
        const total = await this.count(userId);
        if (total <= keepCount) return 0;

        // Find the cutoff point
        const recordsToDelete = await this.prisma.client.passwordHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip: keepCount,
            select: { id: true },
        });

        if (recordsToDelete.length === 0) return 0;

        // Delete older records
        const result = await this.prisma.client.passwordHistory.deleteMany({
            where: {
                userId,
                id: { in: recordsToDelete.map(r => r.id) },
            },
        });
        return result.count;
    }

    async deleteAll(userId: string): Promise<number> {
        const result = await this.prisma.client.passwordHistory.deleteMany({
            where: { userId },
        });
        return result.count;
    }

    async deleteOlderThan(userId: string, date: Date): Promise<number> {
        const result = await this.prisma.client.passwordHistory.deleteMany({
            where: {
                userId,
                createdAt: { lt: date },
            },
        });
        return result.count;
    }
}
