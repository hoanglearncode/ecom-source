/**
 * API Key Repository Implementation
 * Prisma-based implementation of IApiKeyRepository
 */

import { injectable, inject } from 'inversify';
import { IApiKeyRepository } from '@/domain/reponsitory-interface/api-key.reponsitory.interface.js';
import { TYPES } from '@/di/type.js';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.js';

@injectable()
export class ApiKeyRepository implements IApiKeyRepository {
    constructor(@inject(TYPES.PrismaService) private prisma: PrismaService) {}

    // ============================================================
    // Find Operations
    // ============================================================

    async findById(id: string): Promise<{
        id: string;
        userId: string;
        name: string;
        keyHash: string;
        keyPrefix: string;
        scopes: unknown;
        ipWhitelist: string[];
        rateLimit: number | null;
        isActive: boolean;
        expiresAt: Date | null;
        lastUsedAt: Date | null;
        createdAt: Date;
        revokedAt: Date | null;
    } | null> {
        const record = await this.prisma.client.apiKey.findUnique({
            where: { id },
        });
        if (!record) return null;
        return this.mapToEntity(record);
    }

    async findByKeyHash(keyHash: string): Promise<{
        id: string;
        userId: string;
        name: string;
        keyHash: string;
        keyPrefix: string;
        scopes: unknown;
        ipWhitelist: string[];
        rateLimit: number | null;
        isActive: boolean;
        expiresAt: Date | null;
        lastUsedAt: Date | null;
        createdAt: Date;
        revokedAt: Date | null;
    } | null> {
        const record = await this.prisma.client.apiKey.findFirst({
            where: { keyHash },
        });
        if (!record) return null;
        return this.mapToEntity(record);
    }

    async getByUserId(userId: string): Promise<Array<{
        id: string;
        name: string;
        keyPrefix: string;
        scopes: unknown;
        ipWhitelist: string[];
        rateLimit: number | null;
        isActive: boolean;
        expiresAt: Date | null;
        lastUsedAt: Date | null;
        createdAt: Date;
        revokedAt: Date | null;
    }>> {
        const records = await this.prisma.client.apiKey.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                keyPrefix: true,
                scopes: true,
                ipWhitelist: true,
                rateLimit: true,
                isActive: true,
                expiresAt: true,
                lastUsedAt: true,
                createdAt: true,
                revokedAt: true,
            },
        });
        return records;
    }

    async getActiveByUserId(userId: string): Promise<Array<{
        id: string;
        name: string;
        keyPrefix: string;
        scopes: unknown;
        ipWhitelist: string[];
        rateLimit: number | null;
        expiresAt: Date | null;
        lastUsedAt: Date | null;
        createdAt: Date;
    }>> {
        const records = await this.prisma.client.apiKey.findMany({
            where: {
                userId,
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            select: {
                id: true,
                name: true,
                keyPrefix: true,
                scopes: true,
                ipWhitelist: true,
                rateLimit: true,
                expiresAt: true,
                lastUsedAt: true,
                createdAt: true,
            },
        });
        return records;
    }

    // ============================================================
    // Create Operations
    // ============================================================

    async create(data: {
        userId: string;
        name: string;
        keyHash: string;
        keyPrefix: string;
        scopes?: unknown;
        ipWhitelist?: string[];
        rateLimit?: number | null;
        expiresAt?: Date | null;
    }): Promise<{
        id: string;
        userId: string;
        name: string;
        keyPrefix: string;
        scopes: unknown;
        ipWhitelist: string[];
        rateLimit: number | null;
        isActive: boolean;
        expiresAt: Date | null;
        createdAt: Date;
    }> {
        const record = await this.prisma.client.apiKey.create({
            data: {
                id: crypto.randomUUID(),
                userId: data.userId,
                name: data.name,
                keyHash: data.keyHash,
                keyPrefix: data.keyPrefix,
                scopes: data.scopes || {},
                ipWhitelist: data.ipWhitelist || [],
                rateLimit: data.rateLimit || null,
                expiresAt: data.expiresAt || null,
            },
        });
        return {
            id: record.id,
            userId: record.userId,
            name: record.name,
            keyPrefix: record.keyPrefix,
            scopes: record.scopes,
            ipWhitelist: Array.isArray(record.ipWhitelist)
                ? record.ipWhitelist
                : JSON.parse(record.ipWhitelist || '[]'),
            rateLimit: record.rateLimit,
            isActive: record.isActive,
            expiresAt: record.expiresAt,
            createdAt: record.createdAt,
        };
    }

    // ============================================================
    // Update Operations
    // ============================================================

    async update(id: string, data: {
        name?: string;
        scopes?: unknown;
        ipWhitelist?: string[];
        rateLimit?: number | null;
        expiresAt?: Date | null;
    }): Promise<boolean> {
        try {
            await this.prisma.client.apiKey.update({
                where: { id },
                data: {
                    ...(data.name !== undefined && { name: data.name }),
                    ...(data.scopes !== undefined && { scopes: data.scopes }),
                    ...(data.ipWhitelist !== undefined && { ipWhitelist: data.ipWhitelist }),
                    ...(data.rateLimit !== undefined && { rateLimit: data.rateLimit }),
                    ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
                },
            });
            return true;
        } catch {
            return false;
        }
    }

    async revoke(id: string): Promise<boolean> {
        try {
            await this.prisma.client.apiKey.update({
                where: { id },
                data: { isActive: false, revokedAt: new Date() },
            });
            return true;
        } catch {
            return false;
        }
    }

    async activate(id: string): Promise<boolean> {
        try {
            await this.prisma.client.apiKey.update({
                where: { id },
                data: { isActive: true },
            });
            return true;
        } catch {
            return false;
        }
    }

    async deactivate(id: string): Promise<boolean> {
        return this.revoke(id);
    }

    async updateLastUsed(id: string): Promise<boolean> {
        try {
            await this.prisma.client.apiKey.update({
                where: { id },
                data: { lastUsedAt: new Date() },
            });
            return true;
        } catch {
            return false;
        }
    }

    async regenerate(id: string, newKeyHash: string, newKeyPrefix: string): Promise<boolean> {
        try {
            await this.prisma.client.apiKey.update({
                where: { id },
                data: { keyHash: newKeyHash, keyPrefix: newKeyPrefix },
            });
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================
    // Validation Operations
    // ============================================================

    async validate(keyHash: string): Promise<{
        id: string;
        userId: string;
        name: string;
        scopes: unknown;
        ipWhitelist: string[];
        rateLimit: number | null;
        isActive: boolean;
        expiresAt: Date | null;
    } | null> {
        const record = await this.prisma.client.apiKey.findFirst({
            where: { keyHash },
            select: {
                id: true,
                userId: true,
                name: true,
                scopes: true,
                ipWhitelist: true,
                rateLimit: true,
                isActive: true,
                expiresAt: true,
            },
        });

        if (!record || !record.isActive) return null;
        if (record.expiresAt && record.expiresAt < new Date()) return null;

        return {
            id: record.id,
            userId: record.userId,
            name: record.name,
            scopes: record.scopes,
            ipWhitelist: Array.isArray(record.ipWhitelist)
                ? record.ipWhitelist
                : JSON.parse(record.ipWhitelist || '[]'),
            rateLimit: record.rateLimit,
            isActive: record.isActive,
            expiresAt: record.expiresAt,
        };
    }

    async isValid(id: string): Promise<boolean> {
        const record = await this.prisma.client.apiKey.findUnique({
            where: { id },
            select: { isActive: true, expiresAt: true },
        });
        if (!record || !record.isActive) return false;
        if (record.expiresAt && record.expiresAt < new Date()) return false;
        return true;
    }

    async isIPAllowed(keyId: string, ip: string): Promise<boolean> {
        const record = await this.prisma.client.apiKey.findUnique({
            where: { id: keyId },
            select: { ipWhitelist: true },
        });
        if (!record) return false;

        const whitelist = Array.isArray(record.ipWhitelist)
            ? record.ipWhitelist
            : JSON.parse(record.ipWhitelist || '[]');

        if (whitelist.length === 0) return true; // No restriction
        return whitelist.includes(ip);
    }

    // ============================================================
    // Query Operations
    // ============================================================

    async getRateLimit(keyId: string): Promise<number | null> {
        const record = await this.prisma.client.apiKey.findUnique({
            where: { id: keyId },
            select: { rateLimit: true },
        });
        return record?.rateLimit || null;
    }

    async getScopes(keyId: string): Promise<string[]> {
        const record = await this.prisma.client.apiKey.findUnique({
            where: { id: keyId },
            select: { scopes: true },
        });
        if (!record) return [];

        const scopes = record.scopes as { scopes?: string[] };
        return scopes?.scopes || [];
    }

    async hasScope(keyId: string, scope: string): Promise<boolean> {
        const scopes = await this.getScopes(keyId);
        return scopes.includes(scope);
    }

    async countActive(userId: string): Promise<number> {
        return this.prisma.client.apiKey.count({
            where: {
                userId,
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
        });
    }

    async getUsageStats(keyId: string): Promise<{
        lastUsedAt: Date | null;
        createdAt: Date;
    }> {
        const record = await this.prisma.client.apiKey.findUnique({
            where: { id: keyId },
            select: { lastUsedAt: true, createdAt: true },
        });
        if (!record) throw new Error('API key not found');
        return record;
    }

    async getForUser(keyId: string, userId: string): Promise<{
        id: string;
        name: string;
        keyPrefix: string;
        scopes: unknown;
        ipWhitelist: string[];
        rateLimit: number | null;
        isActive: boolean;
        expiresAt: Date | null;
        lastUsedAt: Date | null;
        createdAt: Date;
        revokedAt: Date | null;
    } | null> {
        const record = await this.prisma.client.apiKey.findFirst({
            where: { id: keyId, userId },
        });
        if (!record) return null;

        return {
            id: record.id,
            name: record.name,
            keyPrefix: record.keyPrefix,
            scopes: record.scopes,
            ipWhitelist: Array.isArray(record.ipWhitelist)
                ? record.ipWhitelist
                : JSON.parse(record.ipWhitelist || '[]'),
            rateLimit: record.rateLimit,
            isActive: record.isActive,
            expiresAt: record.expiresAt,
            lastUsedAt: record.lastUsedAt,
            createdAt: record.createdAt,
            revokedAt: record.revokedAt,
        };
    }

    // ============================================================
    // Delete Operations
    // ============================================================

    async deleteExpired(): Promise<number> {
        const result = await this.prisma.client.apiKey.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        return result.count;
    }

    async deleteOldRevoked(olderThan: Date): Promise<number> {
        const result = await this.prisma.client.apiKey.deleteMany({
            where: {
                isActive: false,
                revokedAt: { lt: olderThan },
            },
        });
        return result.count;
    }

    async deleteAllForUser(userId: string): Promise<number> {
        const result = await this.prisma.client.apiKey.deleteMany({
            where: { userId },
        });
        return result.count;
    }

    // ============================================================
    // Private Helper Methods
    // ============================================================

    private mapToEntity(record: any): any {
        return {
            id: record.id,
            userId: record.userId,
            name: record.name,
            keyHash: record.keyHash,
            keyPrefix: record.keyPrefix,
            scopes: record.scopes,
            ipWhitelist: Array.isArray(record.ipWhitelist)
                ? record.ipWhitelist
                : JSON.parse(record.ipWhitelist || '[]'),
            rateLimit: record.rateLimit,
            isActive: record.isActive,
            expiresAt: record.expiresAt,
            lastUsedAt: record.lastUsedAt,
            createdAt: record.createdAt,
            revokedAt: record.revokedAt,
        };
    }
}
