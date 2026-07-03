/**
 * Session Use Case Implementation
 * TODO: Implement full session logic
 */

import { injectable, inject } from 'inversify';
import {
    SessionUseCaseInterface,
    SessionInfo,
    CreateSessionData,
} from '@/application/interface/session.use-case.interface.js';
import { TYPES } from '@/di/type.js';
import { ITokenRepository } from '@/domain/reponsitory-interface/token.reponsitory.interface.js';
import { logger } from '@/shared/logger/index.js';

@injectable()
export class SessionUseCase implements SessionUseCaseInterface {
    constructor(
        @inject(TYPES.TokenRepository) private tokenRepository: ITokenRepository,
    ) {}

    async createSession(data: CreateSessionData): Promise<SessionInfo> {
        logger.info('Create session', { userId: data.userId });

        const now = new Date();
        const session = await this.tokenRepository.create({
            userId: data.userId,
            accessJti: crypto.randomUUID(),
            refreshToken: await this.hashRefreshToken(crypto.randomUUID()),
            deviceId: data.deviceId || null,
            deviceName: data.deviceName || null,
            deviceType: data.deviceType || null,
            ipAddress: data.ipAddress || null,
            userAgent: data.userAgent || null,
            accessExpiresAt: new Date(now.getTime() + 15 * 60 * 1000),
            refreshExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        });

        return {
            id: session.id,
            userId: session.userId,
            deviceName: session.deviceName,
            deviceType: session.deviceType,
            deviceId: session.deviceId,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            isCurrent: true,
            lastUsedAt: session.lastUsedAt,
            createdAt: session.createdAt,
        };
    }

    async getUserSessions(userId: string): Promise<SessionInfo[]> {
        const tokens = await this.tokenRepository.findByUserId(userId);
        return tokens.map(t => ({
            id: t.id,
            userId: t.userId,
            deviceName: t.deviceName,
            deviceType: t.deviceType,
            deviceId: t.deviceId,
            ipAddress: t.ipAddress,
            userAgent: t.userAgent,
            isCurrent: false,
            lastUsedAt: t.lastUsedAt,
            createdAt: t.createdAt,
        }));
    }

    async getSession(sessionId: string, userId: string): Promise<SessionInfo | null> {
        const token = await this.tokenRepository.findById(sessionId);
        if (!token || token.userId !== userId) {
            return null;
        }

        return {
            id: token.id,
            userId: token.userId,
            deviceName: token.deviceName,
            deviceType: token.deviceType,
            deviceId: token.deviceId,
            ipAddress: token.ipAddress,
            userAgent: token.userAgent,
            isCurrent: false,
            lastUsedAt: token.lastUsedAt,
            createdAt: token.createdAt,
        };
    }

    async revokeSession(sessionId: string, userId: string): Promise<boolean> {
        const token = await this.tokenRepository.findById(sessionId);
        if (!token || token.userId !== userId) {
            return false;
        }

        return this.tokenRepository.revoke(sessionId);
    }

    async revokeAllSessions(userId: string): Promise<boolean> {
        const count = await this.tokenRepository.revokeAllForUser(userId);
        return count > 0;
    }

    async revokeOtherSessions(userId: string, currentSessionId: string): Promise<boolean> {
        const count = await this.tokenRepository.revokeAllExcept(userId, currentSessionId);
        return count > 0;
    }

    async revokeSessionsByDevice(userId: string, deviceId: string): Promise<boolean> {
        const count = await this.tokenRepository.revokeByDevice(userId, deviceId);
        return count > 0;
    }

    async updateSessionActivity(sessionId: string): Promise<boolean> {
        return this.tokenRepository.updateLastUsed(sessionId);
    }

    async isSessionValid(sessionId: string): Promise<boolean> {
        const token = await this.tokenRepository.findById(sessionId);
        return token !== null && !token.isRevoked && !token.isRefreshExpired();
    }

    async getSessionByDevice(userId: string, deviceId: string): Promise<SessionInfo | null> {
        const token = await this.tokenRepository.findByUserAndDevice(userId, deviceId);
        if (!token) return null;

        return {
            id: token.id,
            userId: token.userId,
            deviceName: token.deviceName,
            deviceType: token.deviceType,
            deviceId: token.deviceId,
            ipAddress: token.ipAddress,
            userAgent: token.userAgent,
            isCurrent: false,
            lastUsedAt: token.lastUsedAt,
            createdAt: token.createdAt,
        };
    }

    async getActiveSessionCount(userId: string): Promise<number> {
        return this.tokenRepository.getActiveCount(userId);
    }

    async cleanupExpiredSessions(olderThanDays: number = 30): Promise<number> {
        const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
        return this.tokenRepository.deleteOldRevoked(cutoffDate);
    }

    async revokeSessionsByIP(ipAddress: string): Promise<boolean> {
        const count = await this.tokenRepository.revokeByIP(ipAddress);
        return count > 0;
    }

    async getOldSessions(userId: string, date: Date): Promise<SessionInfo[]> {
        const tokens = await this.tokenRepository.getOldSessions(userId, date);
        return tokens.map(t => ({
            id: t.id,
            userId: t.userId,
            deviceName: t.deviceName,
            deviceType: t.deviceType,
            deviceId: t.deviceId,
            ipAddress: t.ipAddress,
            userAgent: t.userAgent,
            isCurrent: false,
            lastUsedAt: t.lastUsedAt,
            createdAt: t.createdAt,
        }));
    }

    async hasDeviceSession(userId: string, deviceId: string): Promise<boolean> {
        return this.tokenRepository.hasDeviceToken(userId, deviceId);
    }

    private async hashRefreshToken(token: string): Promise<string> {
        // Simple hash for storage - in production, use bcrypt
        const encoder = new TextEncoder();
        const data = encoder.encode(token);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}
