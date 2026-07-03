/**
 * Token Repository Implementation
 * TODO: Implement full repository logic
 */

import { injectable, inject } from 'inversify';
import { Token, type TokenProps, type CreateTokenData } from '@/domain/entity/token.entity.js';
import { ITokenRepository } from '@/domain/reponsitory-interface/token.reponsitory.interface.js';
import { TYPES } from '@/di/type.js';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.js';

@injectable()
export class TokenRepository implements ITokenRepository {
    constructor(@inject(TYPES.PrismaService) private prisma: PrismaService) {}

    async findById(id: string): Promise<Token | null> {
        const record = await this.prisma.client.token.findUnique({ where: { id } });
        if (!record) return null;
        return Token.fromPersistence(this.mapToEntity(record));
    }

    async findByAccessJti(accessJti: string): Promise<Token | null> {
        const record = await this.prisma.client.token.findUnique({ where: { accessJti } });
        if (!record) return null;
        return Token.fromPersistence(this.mapToEntity(record));
    }

    async findByRefreshToken(refreshToken: string): Promise<Token | null> {
        const record = await this.prisma.client.token.findFirst({ where: { refreshToken } });
        if (!record) return null;
        return Token.fromPersistence(this.mapToEntity(record));
    }

    async findByUserId(userId: string): Promise<Token[]> {
        const records = await this.prisma.client.token.findMany({ where: { userId } });
        return records.map(r => Token.fromPersistence(this.mapToEntity(r)));
    }

    async findActiveByUserId(userId: string): Promise<Token[]> {
        const records = await this.prisma.client.token.findMany({
            where: { userId, isRevoked: false, refreshExpiresAt: { gt: new Date() } },
        });
        return records.map(r => Token.fromPersistence(this.mapToEntity(r)));
    }

    async findByUserAndDevice(userId: string, deviceId: string): Promise<Token | null> {
        const record = await this.prisma.client.token.findFirst({
            where: { userId, deviceId },
        });
        if (!record) return null;
        return Token.fromPersistence(this.mapToEntity(record));
    }

    async create(data: CreateTokenData): Promise<Token> {
        const record = await this.prisma.client.token.create({
            data: {
                id: crypto.randomUUID(),
                userId: data.userId,
                accessJti: data.accessJti,
                refreshToken: data.refreshToken,
                deviceId: data.deviceId,
                deviceName: data.deviceName,
                deviceType: data.deviceType,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                accessExpiresAt: data.accessExpiresAt,
                refreshExpiresAt: data.refreshExpiresAt,
            },
        });
        return Token.fromPersistence(this.mapToEntity(record));
    }

    async update(id: string, data: Partial<TokenProps>): Promise<Token | null> {
        try {
            const record = await this.prisma.client.token.update({
                where: { id },
                data: {
                    ...(data.isRevoked !== undefined && { isRevoked: data.isRevoked }),
                    ...(data.lastUsedAt !== undefined && { lastUsedAt: data.lastUsedAt }),
                    ...(data.deviceName !== undefined && { deviceName: data.deviceName }),
                    ...(data.deviceType !== undefined && { deviceType: data.deviceType }),
                },
            });
            return Token.fromPersistence(this.mapToEntity(record));
        } catch {
            return null;
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            await this.prisma.client.token.delete({ where: { id } });
            return true;
        } catch {
            return false;
        }
    }

    async revoke(id: string): Promise<boolean> {
        return this.update(id, { isRevoked: true }).then(() => true).catch(() => false);
    }

    async revokeAllForUser(userId: string): Promise<number> {
        const result = await this.prisma.client.token.updateMany({
            where: { userId },
            data: { isRevoked: true },
        });
        return result.count;
    }

    async revokeAllExcept(userId: string, exceptTokenId: string): Promise<number> {
        const result = await this.prisma.client.token.updateMany({
            where: { userId, id: { not: exceptTokenId } },
            data: { isRevoked: true },
        });
        return result.count;
    }

    async revokeByDevice(userId: string, deviceId: string): Promise<number> {
        const result = await this.prisma.client.token.updateMany({
            where: { userId, deviceId },
            data: { isRevoked: true },
        });
        return result.count;
    }

    async updateLastUsed(id: string): Promise<boolean> {
        return this.update(id, { lastUsedAt: new Date() }).then(() => true).catch(() => false);
    }

    async updateDeviceInfo(id: string, deviceName: string, deviceType: string): Promise<boolean> {
        return this.update(id, { deviceName, deviceType }).then(() => true).catch(() => false);
    }

    async getActiveCount(userId: string): Promise<number> {
        return this.prisma.client.token.count({
            where: { userId, isRevoked: false, refreshExpiresAt: { gt: new Date() } },
        });
    }

    async getActiveSessions(userId: string): Promise<Array<{
        id: string;
        deviceName: string | null;
        deviceType: string | null;
        ipAddress: string | null;
        lastUsedAt: Date | null;
        createdAt: Date;
    }>> {
        const records = await this.prisma.client.token.findMany({
            where: { userId, isRevoked: false, refreshExpiresAt: { gt: new Date() } },
            select: {
                id: true,
                deviceName: true,
                deviceType: true,
                ipAddress: true,
                lastUsedAt: true,
                createdAt: true,
            },
        });
        return records;
    }

    async hasDeviceToken(userId: string, deviceId: string): Promise<boolean> {
        const count = await this.prisma.client.token.count({
            where: { userId, deviceId, isRevoked: false, refreshExpiresAt: { gt: new Date() } },
        });
        return count > 0;
    }

    async getOldSessions(userId: string, olderThan: Date): Promise<Token[]> {
        const records = await this.prisma.client.token.findMany({
            where: { userId, createdAt: { lt: olderThan } },
        });
        return records.map(r => Token.fromPersistence(this.mapToEntity(r)));
    }

    async getExpiredCount(): Promise<number> {
        return this.prisma.client.token.count({
            where: { refreshExpiresAt: { lt: new Date() } },
        });
    }

    async deleteExpired(): Promise<number> {
        const result = await this.prisma.client.token.deleteMany({
            where: { refreshExpiresAt: { lt: new Date() } },
        });
        return result.count;
    }

    async deleteOldRevoked(olderThan: Date): Promise<number> {
        const result = await this.prisma.client.token.deleteMany({
            where: { isRevoked: true, createdAt: { lt: olderThan } },
        });
        return result.count;
    }

    async deleteAllForUser(userId: string): Promise<number> {
        const result = await this.prisma.client.token.deleteMany({
            where: { userId },
        });
        return result.count;
    }

    async isRefreshTokenValid(refreshToken: string): Promise<boolean> {
        const record = await this.prisma.client.token.findFirst({
            where: { refreshToken, isRevoked: false, refreshExpiresAt: { gt: new Date() } },
        });
        return !!record;
    }

    async isAccessJtiValid(accessJti: string): Promise<boolean> {
        const record = await this.prisma.client.token.findFirst({
            where: { accessJti, isRevoked: false, accessExpiresAt: { gt: new Date() } },
        });
        return !!record;
    }

    async validateRefreshToken(refreshToken: string): Promise<{
        userId: string;
        deviceId: string | null;
        expiresAt: Date;
        isValid: boolean;
    } | null> {
        const record = await this.prisma.client.token.findFirst({
            where: { refreshToken },
        });
        if (!record) return null;
        return {
            userId: record.userId,
            deviceId: record.deviceId,
            expiresAt: record.refreshExpiresAt,
            isValid: !record.isRevoked && record.refreshExpiresAt > new Date(),
        };
    }

    async findByUserIds(userIds: string[]): Promise<Token[]> {
        const records = await this.prisma.client.token.findMany({
            where: { userId: { in: userIds } },
        });
        return records.map(r => Token.fromPersistence(this.mapToEntity(r)));
    }

    async revokeByIP(ipAddress: string): Promise<number> {
        const result = await this.prisma.client.token.updateMany({
            where: { ipAddress },
            data: { isRevoked: true },
        });
        return result.count;
    }

    async findByIP(ipAddress: string): Promise<Token[]> {
        const records = await this.prisma.client.token.findMany({ where: { ipAddress } });
        return records.map(r => Token.fromPersistence(this.mapToEntity(r)));
    }

    async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
        return this.prisma.client.$transaction(async (tx) => callback(tx));
    }

    private mapToEntity(record: any): TokenProps {
        return {
            id: record.id,
            userId: record.userId,
            accessJti: record.accessJti,
            refreshToken: record.refreshToken,
            deviceId: record.deviceId,
            deviceName: record.deviceName,
            deviceType: record.deviceType,
            ipAddress: record.ipAddress,
            userAgent: record.userAgent,
            isRevoked: record.isRevoked,
            accessExpiresAt: record.accessExpiresAt,
            refreshExpiresAt: record.refreshExpiresAt,
            lastUsedAt: record.lastUsedAt,
            createdAt: record.createdAt,
        };
    }
}
