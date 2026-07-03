/**
 * Audit Log Repository Implementation
 * Prisma-based implementation of IAuditLogRepository
 */

import { injectable, inject } from 'inversify';
import { IAuditLogRepository } from '@/domain/reponsitory-interface/audit-log.reponsitory.interface.js';
import { TYPES } from '@/di/type.js';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.js';

@injectable()
export class AuditLogRepository implements IAuditLogRepository {
    constructor(@inject(TYPES.PrismaService) private prisma: PrismaService) {}

    // ============================================================
    // Create Operations
    // ============================================================

    async create(data: {
        userId?: string;
        action: string;
        resource?: string;
        resourceId?: string;
        ipAddress?: string;
        userAgent?: string;
        oldValue?: unknown;
        newValue?: unknown;
        metadata?: unknown;
        isSuccess: boolean;
        failureReason?: string;
    }): Promise<string> {
        const record = await this.prisma.client.auditLog.create({
            data: {
                id: crypto.randomUUID(),
                userId: data.userId || null,
                action: data.action,
                resource: data.resource || null,
                resourceId: data.resourceId || null,
                ipAddress: data.ipAddress || null,
                userAgent: data.userAgent || null,
                oldValue: data.oldValue || {},
                newValue: data.newValue || {},
                metadata: data.metadata || {},
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
        action?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{
        id: string;
        userId: string | null;
        action: string;
        resource: string | null;
        resourceId: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        oldValue: unknown;
        newValue: unknown;
        metadata: unknown;
        isSuccess: boolean;
        failureReason: string | null;
        createdAt: Date;
    }>> {
        const where: any = { userId };

        if (options?.action) where.action = options.action;
        if (options?.startDate || options?.endDate) {
            where.createdAt = {};
            if (options.startDate) where.createdAt.gte = options.startDate;
            if (options.endDate) where.createdAt.lte = options.endDate;
        }

        const records = await this.prisma.client.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 100,
            skip: options?.offset || 0,
        });
        return records;
    }

    async getByAction(action: string, options?: {
        limit?: number;
        offset?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{
        id: string;
        userId: string | null;
        action: string;
        resource: string | null;
        resourceId: string | null;
        isSuccess: boolean;
        createdAt: Date;
    }>> {
        const where: any = { action };

        if (options?.startDate || options?.endDate) {
            where.createdAt = {};
            if (options.startDate) where.createdAt.gte = options.startDate;
            if (options.endDate) where.createdAt.lte = options.endDate;
        }

        const records = await this.prisma.client.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 100,
            skip: options?.offset || 0,
            select: {
                id: true,
                userId: true,
                action: true,
                resource: true,
                resourceId: true,
                isSuccess: true,
                createdAt: true,
            },
        });
        return records;
    }

    async getByResource(resource: string, resourceId: string): Promise<Array<{
        id: string;
        userId: string | null;
        action: string;
        oldValue: unknown;
        newValue: unknown;
        isSuccess: boolean;
        createdAt: Date;
    }>> {
        const records = await this.prisma.client.auditLog.findMany({
            where: { resource, resourceId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                userId: true,
                action: true,
                oldValue: true,
                newValue: true,
                isSuccess: true,
                createdAt: true,
            },
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
        action: string;
        isSuccess: boolean;
        createdAt: Date;
    }>> {
        const where: any = { ipAddress };

        if (options?.startDate || options?.endDate) {
            where.createdAt = {};
            if (options.startDate) where.createdAt.gte = options.startDate;
            if (options.endDate) where.createdAt.lte = options.endDate;
        }

        const records = await this.prisma.client.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 100,
            skip: options?.offset || 0,
            select: {
                id: true,
                userId: true,
                action: true,
                isSuccess: true,
                createdAt: true,
            },
        });
        return records;
    }

    async getFailedLogins(userId: string, limit: number = 10): Promise<Array<{
        id: string;
        action: string;
        ipAddress: string | null;
        failureReason: string | null;
        createdAt: Date;
    }>> {
        const records = await this.prisma.client.auditLog.findMany({
            where: {
                userId,
                action: { in: ['LOGIN', 'LOGIN_ATTEMPT'] },
                isSuccess: false,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                action: true,
                ipAddress: true,
                failureReason: true,
                createdAt: true,
            },
        });
        return records;
    }

    async getByUserIds(userIds: string[], options?: {
        limit?: number;
        offset?: number;
        actions?: string[];
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{
        id: string;
        userId: string | null;
        action: string;
        resource: string | null;
        resourceId: string | null;
        isSuccess: boolean;
        createdAt: Date;
    }>> {
        const where: any = { userId: { in: userIds } };

        if (options?.actions) where.action = { in: options.actions };
        if (options?.startDate || options?.endDate) {
            where.createdAt = {};
            if (options.startDate) where.createdAt.gte = options.startDate;
            if (options.endDate) where.createdAt.lte = options.endDate;
        }

        const records = await this.prisma.client.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 100,
            skip: options?.offset || 0,
            select: {
                id: true,
                userId: true,
                action: true,
                resource: true,
                resourceId: true,
                isSuccess: true,
                createdAt: true,
            },
        });
        return records;
    }

    // ============================================================
    // Count & Statistics Operations
    // ============================================================

    async count(criteria?: {
        userId?: string;
        action?: string;
        isSuccess?: boolean;
        startDate?: Date;
        endDate?: Date;
    }): Promise<number> {
        const where: any = {};

        if (criteria?.userId) where.userId = criteria.userId;
        if (criteria?.action) where.action = criteria.action;
        if (criteria?.isSuccess !== undefined) where.isSuccess = criteria.isSuccess;
        if (criteria?.startDate || criteria?.endDate) {
            where.createdAt = {};
            if (criteria.startDate) where.createdAt.gte = criteria.startDate;
            if (criteria.endDate) where.createdAt.lte = criteria.endDate;
        }

        return this.prisma.client.auditLog.count({ where });
    }

    async getStatistics(options?: {
        userId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        total: number;
        successful: number;
        failed: number;
        byAction: Record<string, number>;
    }> {
        const where: any = {};

        if (options?.userId) where.userId = options.userId;
        if (options?.startDate || options?.endDate) {
            where.createdAt = {};
            if (options.startDate) where.createdAt.gte = options.startDate;
            if (options.endDate) where.createdAt.lte = options.endDate;
        }

        const [total, successful, failed, byActionRaw] = await Promise.all([
            this.prisma.client.auditLog.count({ where }),
            this.prisma.client.auditLog.count({ where: { ...where, isSuccess: true } }),
            this.prisma.client.auditLog.count({ where: { ...where, isSuccess: false } }),
            this.prisma.client.auditLog.groupBy({
                by: ['action'],
                where,
                _count: true,
            }),
        ]);

        const byAction: Record<string, number> = {};
        for (const item of byActionRaw) {
            byAction[item.action] = item._count;
        }

        return { total, successful, failed, byAction };
    }

    async getRecentActivity(userIds: string[], limit: number = 5): Promise<Map<string, Array<{
        action: string;
        createdAt: Date;
    }>>> {
        const records = await this.prisma.client.auditLog.findMany({
            where: { userId: { in: userIds } },
            orderBy: { createdAt: 'desc' },
            take: limit * 2, // Get more to distribute
            select: {
                userId: true,
                action: true,
                createdAt: true,
            },
        });

        const result = new Map<string, Array<{ action: string; createdAt: Date }>>();
        for (const record of records) {
            if (!record.userId) continue;
            if (!result.has(record.userId)) {
                result.set(record.userId, []);
            }
            const activities = result.get(record.userId)!;
            if (activities.length < limit) {
                activities.push({
                    action: record.action,
                    createdAt: record.createdAt,
                });
            }
        }
        return result;
    }

    // ============================================================
    // Delete Operations
    // ============================================================

    async deleteOlderThan(date: Date): Promise<number> {
        const result = await this.prisma.client.auditLog.deleteMany({
            where: { createdAt: { lt: date } },
        });
        return result.count;
    }
}
