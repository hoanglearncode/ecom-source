/**
 * OAuth Account Repository Implementation
 * Prisma-based implementation of IOAuthAccountRepository
 */

import { injectable, inject } from 'inversify';
import { OAUTH_PROVIDER } from '@/generated/prisma/enums.js';
import { IOAuthAccountRepository } from '@/domain/reponsitory-interface/oauth-account.reponsitory.interface.js';
import { TYPES } from '@/di/type.js';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.js';

@injectable()
export class OAuthAccountRepository implements IOAuthAccountRepository {
    constructor(@inject(TYPES.PrismaService) private prisma: PrismaService) {}

    // ============================================================
    // Find Operations
    // ============================================================

    async findByProviderAndId(
        provider: OAUTH_PROVIDER,
        providerId: string
    ): Promise<{
        id: string;
        userId: string;
        provider: OAUTH_PROVIDER;
        providerId: string;
        accessToken: string | null;
        refreshToken: string | null;
        tokenExpiresAt: Date | null;
        rawData: unknown;
        createdAt: Date;
        updatedAt: Date;
    } | null> {
        const record = await this.prisma.client.oAuthAccount.findUnique({
            where: {
                provider_providerId: {
                    provider,
                    providerId,
                },
            },
        });
        if (!record) return null;
        return {
            id: record.id,
            userId: record.userId,
            provider: record.provider as OAUTH_PROVIDER,
            providerId: record.providerId,
            accessToken: record.accessToken,
            refreshToken: record.refreshToken,
            tokenExpiresAt: record.tokenExpiresAt,
            rawData: record.rawData,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }

    async findByUserId(userId: string): Promise<Array<{
        id: string;
        userId: string;
        provider: OAUTH_PROVIDER;
        providerId: string;
        tokenExpiresAt: Date | null;
        createdAt: Date;
    }>> {
        const records = await this.prisma.client.oAuthAccount.findMany({
            where: { userId },
            select: {
                id: true,
                userId: true,
                provider: true,
                providerId: true,
                tokenExpiresAt: true,
                createdAt: true,
            },
        });
        return records.map(r => ({
            ...r,
            provider: r.provider as OAUTH_PROVIDER,
        }));
    }

    async findUserIdByProvider(provider: OAUTH_PROVIDER, providerId: string): Promise<string | null> {
        const record = await this.prisma.client.oAuthAccount.findUnique({
            where: {
                provider_providerId: {
                    provider,
                    providerId,
                },
            },
            select: { userId: true },
        });
        return record?.userId || null;
    }

    // ============================================================
    // Check Operations
    // ============================================================

    async isLinked(userId: string, provider: OAUTH_PROVIDER): Promise<boolean> {
        const count = await this.prisma.client.oAuthAccount.count({
            where: { userId, provider },
        });
        return count > 0;
    }

    async isProviderIdLinked(provider: OAUTH_PROVIDER, providerId: string): Promise<boolean> {
        const count = await this.prisma.client.oAuthAccount.count({
            where: { provider, providerId },
        });
        return count > 0;
    }

    // ============================================================
    // Create Operations
    // ============================================================

    async create(data: {
        userId: string;
        provider: OAUTH_PROVIDER;
        providerId: string;
        accessToken?: string;
        refreshToken?: string;
        tokenExpiresAt?: Date;
        rawData?: unknown;
    }): Promise<{
        id: string;
        userId: string;
        provider: OAUTH_PROVIDER;
        providerId: string;
        createdAt: Date;
    }> {
        const record = await this.prisma.client.oAuthAccount.create({
            data: {
                id: crypto.randomUUID(),
                userId: data.userId,
                provider: data.provider,
                providerId: data.providerId,
                accessToken: data.accessToken || null,
                refreshToken: data.refreshToken || null,
                tokenExpiresAt: data.tokenExpiresAt || null,
                rawData: data.rawData || {},
            },
        });
        return {
            id: record.id,
            userId: record.userId,
            provider: record.provider as OAUTH_PROVIDER,
            providerId: record.providerId,
            createdAt: record.createdAt,
        };
    }

    // ============================================================
    // Update Operations
    // ============================================================

    async updateTokens(
        id: string,
        accessToken: string,
        refreshToken?: string,
        tokenExpiresAt?: Date
    ): Promise<boolean> {
        try {
            await this.prisma.client.oAuthAccount.update({
                where: { id },
                data: {
                    accessToken,
                    ...(refreshToken !== undefined && { refreshToken }),
                    ...(tokenExpiresAt && { tokenExpiresAt }),
                },
            });
            return true;
        } catch {
            return false;
        }
    }

    async updateRawData(id: string, rawData: unknown): Promise<boolean> {
        try {
            await this.prisma.client.oAuthAccount.update({
                where: { id },
                data: { rawData },
            });
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================
    // Unlink/Delete Operations
    // ============================================================

    async unlink(userId: string, provider: OAUTH_PROVIDER): Promise<boolean> {
        try {
            await this.prisma.client.oAuthAccount.deleteMany({
                where: { userId, provider },
            });
            return true;
        } catch {
            return false;
        }
    }

    async unlinkById(id: string): Promise<boolean> {
        try {
            await this.prisma.client.oAuthAccount.delete({ where: { id } });
            return true;
        } catch {
            return false;
        }
    }

    async deleteAllForUser(userId: string): Promise<number> {
        const result = await this.prisma.client.oAuthAccount.deleteMany({
            where: { userId },
        });
        return result.count;
    }

    // ============================================================
    // Token Operations
    // ============================================================

    async getWithTokens(
        userId: string,
        provider: OAUTH_PROVIDER
    ): Promise<{
        id: string;
        userId: string;
        provider: OAUTH_PROVIDER;
        providerId: string;
        accessToken: string | null;
        refreshToken: string | null;
        tokenExpiresAt: Date | null;
    } | null> {
        const record = await this.prisma.client.oAuthAccount.findFirst({
            where: { userId, provider },
        });
        if (!record) return null;
        return {
            id: record.id,
            userId: record.userId,
            provider: record.provider as OAUTH_PROVIDER,
            providerId: record.providerId,
            accessToken: record.accessToken,
            refreshToken: record.refreshToken,
            tokenExpiresAt: record.tokenExpiresAt,
        };
    }

    async refreshAccessToken(
        id: string,
        newAccessToken: string,
        newRefreshToken?: string,
        expiresAt?: Date
    ): Promise<boolean> {
        return this.updateTokens(id, newAccessToken, newRefreshToken, expiresAt);
    }

    async findExpiredTokens(): Promise<Array<{
        id: string;
        userId: string;
        provider: OAUTH_PROVIDER;
        refreshToken: string | null;
    }>> {
        const records = await this.prisma.client.oAuthAccount.findMany({
            where: {
                tokenExpiresAt: { lt: new Date() },
                refreshToken: { not: null },
            },
            select: {
                id: true,
                userId: true,
                provider: true,
                refreshToken: true,
            },
        });
        return records.map(r => ({
            ...r,
            provider: r.provider as OAUTH_PROVIDER,
        }));
    }

    // ============================================================
    // Query Operations
    // ============================================================

    async findUsersByProvider(provider: OAUTH_PROVIDER): Promise<Array<{
        userId: string;
        providerId: string;
        createdAt: Date;
    }>> {
        const records = await this.prisma.client.oAuthAccount.findMany({
            where: { provider },
            select: {
                userId: true,
                providerId: true,
                createdAt: true,
            },
        });
        return records;
    }

    async countByUser(userId: string): Promise<number> {
        return this.prisma.client.oAuthAccount.count({
            where: { userId },
        });
    }
}
