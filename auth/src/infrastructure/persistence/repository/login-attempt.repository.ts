/**
 * Login Attempt Repository Implementation
 * Prisma-based implementation of ILoginAttemptRepository
 */

import { injectable, inject } from 'inversify';
import { ILoginAttemptRepository } from '@/domain/reponsitory-interface/login-attempt.reponsitory.interface.js';
import { TYPES } from '@/di/type.js';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.js';

@injectable()
export class LoginAttemptRepository implements ILoginAttemptRepository {
    constructor(@inject(TYPES.PrismaService) private prisma: PrismaService) {}

    // ============================================================
    // Create Operations
    // ============================================================

    async create(data: {
        userId?: string;
        emailOrPhone?: string;
        ipAddress: string;
        deviceId?: string;
        isSuccess: boolean;
        failureReason?: string;
    }): Promise<string> {
        const record = await this.prisma.client.loginAttempt.create({
            data: {
                id: crypto.randomUUID(),
                userId: data.userId || null,
                emailOrPhone: data.emailOrPhone || null,
                ipAddress: data.ipAddress,
                deviceId: data.deviceId || null,
                isSuccess: data.isSuccess,
                failureReason: data.failureReason || null,
            },
        });
        return record.id;
    }

    // ============================================================
    // Get Operations
    // ============================================================

    async getByUserId(userId: string, options?: {
        limit?: number;
        offset?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{
        id: string;
        userId: string | null;
        emailOrPhone: string | null;
        ipAddress: string;
        isSuccess: boolean;
        failureReason: string | null;
        createdAt: Date;
    }>> {
        const where: any = { userId };

        if (options?.startDate || options?.endDate) {
            where.createdAt = {};
            if (options.startDate) where.createdAt.gte = options.startDate;
            if (options.endDate) where.createdAt.lte = options.endDate;
        }

        const records = await this.prisma.client.loginAttempt.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 100,
            skip: options?.offset || 0,
        });
        return records;
    }

    async getByIP(ipAddress: string, options?: {
        limit?: number;
        offset?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{
        id: string;
        userId: string | null;
        emailOrPhone: string | null;
        ipAddress: string;
        isSuccess: boolean;
        failureReason: string | null;
        createdAt: Date;
    }>> {
        const where: any = { ipAddress };

        if (options?.startDate || options?.endDate) {
            where.createdAt = {};
            if (options.startDate) where.createdAt.gte = options.startDate;
            if (options.endDate) where.createdAt.lte = options.endDate;
        }

        const records = await this.prisma.client.loginAttempt.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 100,
            skip: options?.offset || 0,
        });
        return records;
    }

    async getByEmailOrPhone(emailOrPhone: string, options?: {
        limit?: number;
        offset?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{
        id: string;
        userId: string | null;
        emailOrPhone: string | null;
        ipAddress: string;
        isSuccess: boolean;
        failureReason: string | null;
        createdAt: Date;
    }>> {
        const where: any = { emailOrPhone };

        if (options?.startDate || options?.endDate) {
            where.createdAt = {};
            if (options.startDate) where.createdAt.gte = options.startDate;
            if (options.endDate) where.createdAt.lte = options.endDate;
        }

        const records = await this.prisma.client.loginAttempt.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 100,
            skip: options?.offset || 0,
        });
        return records;
    }

    // ============================================================
    // Count Operations
    // ============================================================

    async countFailedAttempts(identifier: {
        userId?: string;
        emailOrPhone?: string;
        ipAddress?: string;
        since?: Date;
    }): Promise<number> {
        const where: any = {
            isSuccess: false,
            ...(identifier.userId && { userId: identifier.userId }),
            ...(identifier.emailOrPhone && { emailOrPhone: identifier.emailOrPhone }),
            ...(identifier.ipAddress && { ipAddress: identifier.ipAddress }),
            ...(identifier.since && { createdAt: { gte: identifier.since } }),
        };

        return this.prisma.client.loginAttempt.count({ where });
    }

    async countFailedInWindow(ipAddress: string, windowMinutes: number): Promise<number> {
        const since = new Date(Date.now() - windowMinutes * 60 * 1000);
        return this.countFailedAttempts({ ipAddress, since });
    }

    async countFailedForUserInWindow(userId: string, windowMinutes: number): Promise<number> {
        const since = new Date(Date.now() - windowMinutes * 60 * 1000);
        return this.countFailedAttempts({ userId, since });
    }

    // ============================================================
    // Last Failed Attempt
    // ============================================================

    async getLastFailed(identifier: {
        userId?: string;
        emailOrPhone?: string;
        ipAddress?: string;
    }): Promise<{
        id: string;
        failureReason: string | null;
        createdAt: Date;
    } | null> {
        const where: any = {
            isSuccess: false,
            ...(identifier.userId && { userId: identifier.userId }),
            ...(identifier.emailOrPhone && { emailOrPhone: identifier.emailOrPhone }),
            ...(identifier.ipAddress && { ipAddress: identifier.ipAddress }),
        };

        const record = await this.prisma.client.loginAttempt.findFirst({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                failureReason: true,
                createdAt: true,
            },
        });
        return record;
    }

    // ============================================================
    // Statistics Operations
    // ============================================================

    async getStatistics(options?: {
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        total: number;
        successful: number;
        failed: number;
        uniqueIPs: number;
        uniqueUsers: number;
    }> {
        const where: any = {};
        if (options?.startDate || options?.endDate) {
            where.createdAt = {};
            if (options.startDate) where.createdAt.gte = options.startDate;
            if (options.endDate) where.createdAt.lte = options.endDate;
        }

        const [total, successful, failed, uniqueIPs, uniqueUsers] = await Promise.all([
            this.prisma.client.loginAttempt.count({ where }),
            this.prisma.client.loginAttempt.count({ where: { ...where, isSuccess: true } }),
            this.prisma.client.loginAttempt.count({ where: { ...where, isSuccess: false } }),
            this.prisma.client.loginAttempt.groupBy({
                by: ['ipAddress'],
                where,
            }).then(results => results.length),
            this.prisma.client.loginAttempt.groupBy({
                by: ['userId'],
                where: { ...where, userId: { not: null } },
            }).then(results => results.length),
        ]);

        return { total, successful, failed, uniqueIPs, uniqueUsers };
    }

    // ============================================================
    // Suspicious Activity Detection
    // ============================================================

    async getSuspiciousIPs(threshold: number, windowMinutes: number): Promise<Array<{
        ipAddress: string;
        failedCount: number;
        lastAttempt: Date;
    }>> {
        const since = new Date(Date.now() - windowMinutes * 60 * 1000);

        const results = await this.prisma.client.loginAttempt.groupBy({
            by: ['ipAddress'],
            where: {
                isSuccess: false,
                createdAt: { gte: since },
            },
            _count: true,
            _max: { createdAt: true },
            having: {
                _count: { gt: threshold },
            },
            orderBy: {
                _count: { ipAddress: 'desc' },
            },
        });

        return results.map(r => ({
            ipAddress: r.ipAddress,
            failedCount: r._count,
            lastAttempt: r._max.createdAt || new Date(),
        }));
    }

    async getBruteForceTargets(threshold: number, windowMinutes: number): Promise<Array<{
        userId: string | null;
        emailOrPhone: string | null;
        failedCount: number;
        lastAttempt: Date;
    }>> {
        const since = new Date(Date.now() - windowMinutes * 60 * 1000);

        const results = await this.prisma.client.loginAttempt.groupBy({
            by: ['userId', 'emailOrPhone'],
            where: {
                isSuccess: false,
                createdAt: { gte: since },
            },
            _count: true,
            _max: { createdAt: true },
            having: {
                _count: { gt: threshold },
            },
        });

        return results.map(r => ({
            userId: r.userId,
            emailOrPhone: r.emailOrPhone,
            failedCount: r._count,
            lastAttempt: r._max.createdAt || new Date(),
        }));
    }

    // ============================================================
    // Cleanup Operations
    // ============================================================

    async deleteOlderThan(date: Date): Promise<number> {
        const result = await this.prisma.client.loginAttempt.deleteMany({
            where: { createdAt: { lt: date } },
        });
        return result.count;
    }

    async cleanup(olderThanDays: number): Promise<number> {
        const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
        return this.deleteOlderThan(cutoffDate);
    }
}
