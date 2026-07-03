/**
 * User Repository Implementation
 * Prisma-based implementation of IUserRepository
 */

import { injectable, inject } from 'inversify';
import { UserEntity, UserRole, UserStatus, type UserProps, type CreateUserData, type UpdateUserData } from '@/domain/entity/user.entity.js';
import { IUserRepository, IAdminUserRepository } from '@/domain/reponsitory-interface/user.reponsitory.interface.js';
import { TYPES } from '@/di/type.js';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.js';
import { UserError, AuthError } from '@/domain/domain-error/error.js';

@injectable()
export class UserRepository implements IUserRepository, IAdminUserRepository {
    constructor(@inject(TYPES.PrismaService) private prisma: PrismaService) {}

    // ============================================================
    // CRUD Operations
    // ============================================================

    async findById(id: string): Promise<UserEntity | null> {
        const record = await this.prisma.client.user.findUnique({
            where: { id },
        });
        if (!record) return null;
        return UserEntity.fromPersistence(this.mapToEntity(record));
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const record = await this.prisma.client.user.findUnique({
            where: { email },
        });
        if (!record) return null;
        return UserEntity.fromPersistence(this.mapToEntity(record));
    }

    async findByPhone(phone: string): Promise<UserEntity | null> {
        const record = await this.prisma.client.user.findUnique({
            where: { phone },
        });
        if (!record) return null;
        return UserEntity.fromPersistence(this.mapToEntity(record));
    }

    async findByUsername(username: string): Promise<UserEntity | null> {
        const record = await this.prisma.client.user.findUnique({
            where: { username },
        });
        if (!record) return null;
        return UserEntity.fromPersistence(this.mapToEntity(record));
    }

    async findByEmailOrUsername(emailOrUsername: string): Promise<UserEntity | null> {
        const record = await this.prisma.client.user.findFirst({
            where: {
                OR: [
                    { email: emailOrUsername },
                    { username: emailOrUsername },
                ],
            },
        });
        if (!record) return null;
        return UserEntity.fromPersistence(this.mapToEntity(record));
    }

    async findByEmailOrPhone(emailOrPhone: string): Promise<UserEntity | null> {
        const record = await this.prisma.client.user.findFirst({
            where: {
                OR: [
                    { email: emailOrPhone },
                    { phone: emailOrPhone },
                ],
            },
        });
        if (!record) return null;
        return UserEntity.fromPersistence(this.mapToEntity(record));
    }

    async emailExists(email: string): Promise<boolean> {
        const count = await this.prisma.client.user.count({
            where: { email },
        });
        return count > 0;
    }

    async phoneExists(phone: string): Promise<boolean> {
        const count = await this.prisma.client.user.count({
            where: { phone },
        });
        return count > 0;
    }

    async usernameExists(username: string): Promise<boolean> {
        const count = await this.prisma.client.user.count({
            where: { username },
        });
        return count > 0;
    }

    async create(data: CreateUserData): Promise<UserEntity> {
        const record = await this.prisma.client.user.create({
            data: {
                id: data.id || crypto.randomUUID(),
                username: data.username,
                email: data.email || null,
                phone: data.phone || null,
                passwordHash: data.passwordHash,
                role: data.role || UserRole.USER,
                status: data.status || UserStatus.UNVERIFIED,
            },
        });
        return UserEntity.fromPersistence(this.mapToEntity(record));
    }

    async update(id: string, data: UpdateUserData): Promise<UserEntity | null> {
        try {
            const record = await this.prisma.client.user.update({
                where: { id },
                data: {
                    ...(data.email !== undefined && { email: data.email }),
                    ...(data.phone !== undefined && { phone: data.phone }),
                    ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash, passwordChangedAt: new Date() }),
                    ...(data.role !== undefined && { role: this.mapRoleToPrisma(data.role) }),
                    ...(data.status !== undefined && { status: this.mapStatusToPrisma(data.status) }),
                    ...(data.failedLoginCount !== undefined && { failedLoginCount: data.failedLoginCount }),
                    ...(data.lockedUntil !== undefined && { lockedUntil: data.lockedUntil }),
                    ...(data.lastLoginAt !== undefined && { lastLoginAt: data.lastLoginAt }),
                    ...(data.lastLoginIp !== undefined && { lastLoginIp: data.lastLoginIp }),
                    ...(data.deletedAt !== undefined && { deletedAt: data.deletedAt }),
                },
            });
            return UserEntity.fromPersistence(this.mapToEntity(record));
        } catch (error: any) {
            if (error.code === 'P2025') {
                return null;
            }
            throw error;
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            await this.prisma.client.user.update({
                where: { id },
                data: {
                    status: UserStatus.DELETED,
                    deletedAt: new Date(),
                },
            });
            return true;
        } catch (error: any) {
            if (error.code === 'P2025') return false;
            throw error;
        }
    }

    async hardDelete(id: string): Promise<boolean> {
        try {
            await this.prisma.client.user.delete({
                where: { id },
            });
            return true;
        } catch (error: any) {
            if (error.code === 'P2025') return false;
            throw error;
        }
    }

    async restore(id: string): Promise<UserEntity | null> {
        try {
            const record = await this.prisma.client.user.update({
                where: { id },
                data: {
                    status: UserStatus.ACTIVE,
                    deletedAt: null,
                },
            });
            return UserEntity.fromPersistence(this.mapToEntity(record));
        } catch (error: any) {
            if (error.code === 'P2025') return null;
            throw error;
        }
    }

    // ============================================================
    // Bulk Operations
    // ============================================================

    async findByIds(ids: string[]): Promise<UserEntity[]> {
        const records = await this.prisma.client.user.findMany({
            where: {
                id: { in: ids },
            },
        });
        return records.map(r => UserEntity.fromPersistence(this.mapToEntity(r)));
    }

    async findAll(options?: {
        skip?: number;
        take?: number;
        orderBy?: { field: keyof UserProps; direction: 'asc' | 'desc' };
        where?: {
            status?: UserStatus[];
            role?: UserRole[];
        };
    }): Promise<{ users: UserEntity[]; total: number }> {
        const where: any = {};
        if (options?.where?.status) {
            where.status = { in: options.where.status.map(s => this.mapStatusToPrisma(s)) };
        }
        if (options?.where?.role) {
            where.role = { in: options.where.role.map(r => this.mapRoleToPrisma(r)) };
        }

        const [users, total] = await Promise.all([
            this.prisma.client.user.findMany({
                where,
                skip: options?.skip,
                take: options?.take,
                orderBy: options?.orderBy ? { [options.orderBy.field]: options.orderBy.direction } : undefined,
            }),
            this.prisma.client.user.count({ where }),
        ]);

        return {
            users: users.map(u => UserEntity.fromPersistence(this.mapToEntity(u))),
            total,
        };
    }

    async count(criteria?: {
        status?: UserStatus;
        role?: UserRole;
    }): Promise<number> {
        const where: any = {};
        if (criteria?.status) {
            where.status = this.mapStatusToPrisma(criteria.status);
        }
        if (criteria?.role) {
            where.role = this.mapRoleToPrisma(criteria.role);
        }
        return this.prisma.client.user.count({ where });
    }

    // ============================================================
    // Status & Role Operations
    // ============================================================

    async updateStatus(id: string, status: UserStatus): Promise<boolean> {
        try {
            await this.prisma.client.user.update({
                where: { id },
                data: { status: this.mapStatusToPrisma(status) },
            });
            return true;
        } catch (error: any) {
            if (error.code === 'P2025') return false;
            throw error;
        }
    }

    async updateRole(id: string, role: UserRole): Promise<boolean> {
        try {
            await this.prisma.client.user.update({
                where: { id },
                data: { role: this.mapRoleToPrisma(role) },
            });
            return true;
        } catch (error: any) {
            if (error.code === 'P2025') return false;
            throw error;
        }
    }

    async findByStatus(status: UserStatus): Promise<UserEntity[]> {
        const records = await this.prisma.client.user.findMany({
            where: { status: this.mapStatusToPrisma(status) },
        });
        return records.map(r => UserEntity.fromPersistence(this.mapToEntity(r)));
    }

    async findByRole(role: UserRole): Promise<UserEntity[]> {
        const records = await this.prisma.client.user.findMany({
            where: { role: this.mapRoleToPrisma(role) },
        });
        return records.map(r => UserEntity.fromPersistence(this.mapToEntity(r)));
    }

    // ============================================================
    // Security Operations
    // ============================================================

    async incrementFailedLoginCount(id: string): Promise<UserEntity | null> {
        const user = await this.findById(id);
        if (!user) return null;

        const newCount = user.failedLoginCount + 1;
        const lockedUntil = newCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

        return this.update(id, {
            failedLoginCount: newCount,
            lockedUntil,
        });
    }

    async resetFailedLoginCount(id: string): Promise<boolean> {
        try {
            await this.prisma.client.user.update({
                where: { id },
                data: {
                    failedLoginCount: 0,
                    lockedUntil: null,
                },
            });
            return true;
        } catch (error: any) {
            if (error.code === 'P2025') return false;
            throw error;
        }
    }

    async lockAccount(id: string, lockedUntil: Date): Promise<boolean> {
        try {
            await this.prisma.client.user.update({
                where: { id },
                data: { lockedUntil },
            });
            return true;
        } catch (error: any) {
            if (error.code === 'P2025') return false;
            throw error;
        }
    }

    async unlockAccount(id: string): Promise<boolean> {
        return this.resetFailedLoginCount(id);
    }

    async updateLastLogin(id: string, ip: string, loginAt?: Date): Promise<boolean> {
        try {
            await this.prisma.client.user.update({
                where: { id },
                data: {
                    lastLoginAt: loginAt || new Date(),
                    lastLoginIp: ip,
                    failedLoginCount: 0,
                    lockedUntil: null,
                },
            });
            return true;
        } catch (error: any) {
            if (error.code === 'P2025') return false;
            throw error;
        }
    }

    async updatePassword(id: string, passwordHash: string): Promise<boolean> {
        try {
            await this.prisma.client.user.update({
                where: { id },
                data: {
                    passwordHash,
                    passwordChangedAt: new Date(),
                },
            });
            return true;
        } catch (error: any) {
            if (error.code === 'P2025') return false;
            throw error;
        }
    }

    async markAsVerified(id: string): Promise<boolean> {
        return this.updateStatus(id, UserStatus.ACTIVE);
    }

    async findUnverifiedUsers(olderThanDays: number): Promise<UserEntity[]> {
        const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
        const records = await this.prisma.client.user.findMany({
            where: {
                status: UserStatus.UNVERIFIED,
                createdAt: { lt: cutoffDate },
            },
        });
        return records.map(r => UserEntity.fromPersistence(this.mapToEntity(r)));
    }

    // ============================================================
    // Admin Operations
    // ============================================================

    async findBannedUsers(): Promise<UserEntity[]> {
        return this.findByStatus(UserStatus.BANNED);
    }

    async findDeletedUsers(): Promise<UserEntity[]> {
        const records = await this.prisma.client.user.findMany({
            where: {
                status: UserStatus.DELETED,
                deletedAt: { not: null },
            },
        });
        return records.map(r => UserEntity.fromPersistence(this.mapToEntity(r)));
    }

    async banUser(id: string, reason?: string): Promise<boolean> {
        return this.updateStatus(id, UserStatus.BANNED);
    }

    async unbanUser(id: string): Promise<boolean> {
        return this.updateStatus(id, UserStatus.ACTIVE);
    }

    async getStatistics(): Promise<{
        total: number;
        active: number;
        unverified: number;
        banned: number;
        deleted: number;
    }> {
        const [total, active, unverified, banned, deleted] = await Promise.all([
            this.prisma.client.user.count(),
            this.prisma.client.user.count({ where: { status: UserStatus.ACTIVE } }),
            this.prisma.client.user.count({ where: { status: UserStatus.UNVERIFIED } }),
            this.prisma.client.user.count({ where: { status: UserStatus.BANNED } }),
            this.prisma.client.user.count({ where: { status: UserStatus.DELETED } }),
        ]);

        return { total, active, unverified, banned, deleted };
    }

    // ============================================================
    // Transaction Operations
    // ============================================================

    async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
        return this.prisma.client.$transaction(async (tx) => {
            return callback(tx);
        });
    }

    // ============================================================
    // Private Helper Methods
    // ============================================================

    private mapToEntity(record: any): UserProps {
        return {
            id: record.id,
            username: record.username,
            email: record.email,
            phone: record.phone,
            passwordHash: record.passwordHash,
            role: this.mapPrismaRoleToDomain(record.role),
            status: this.mapPrismaStatusToDomain(record.status),
            failedLoginCount: record.failedLoginCount,
            lockedUntil: record.lockedUntil,
            lastLoginAt: record.lastLoginAt,
            lastLoginIp: record.lastLoginIp,
            passwordChangedAt: record.passwordChangedAt,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            deletedAt: record.deletedAt,
        };
    }

    private mapRoleToPrisma(role: UserRole): ROLE {
        switch (role) {
            case UserRole.USER: return ROLE.USER;
            case UserRole.ADMIN: return ROLE.ADMIN;
            case UserRole.STAFF: return ROLE.STAFF;
            case UserRole.INVESTOR: return ROLE.INVESTOR;
            default: return ROLE.USER;
        }
    }

    private mapPrismaRoleToDomain(role: ROLE): UserRole {
        switch (role) {
            case ROLE.USER: return UserRole.USER;
            case ROLE.ADMIN: return UserRole.ADMIN;
            case ROLE.STAFF: return UserRole.STAFF;
            case ROLE.INVESTOR: return UserRole.INVESTOR;
            default: return UserRole.USER;
        }
    }

    private mapStatusToPrisma(status: UserStatus): STATUS {
        switch (status) {
            case UserStatus.ACTIVE: return STATUS.ACTIVE;
            case UserStatus.BANNED: return STATUS.BANNED;
            case UserStatus.DELETED: return STATUS.DELETED;
            case UserStatus.UNVERIFIED: return STATUS.UNVERIFIED;
            default: return STATUS.UNVERIFIED;
        }
    }

    private mapPrismaStatusToDomain(status: STATUS): UserStatus {
        switch (status) {
            case STATUS.ACTIVE: return UserStatus.ACTIVE;
            case STATUS.BANNED: return UserStatus.BANNED;
            case STATUS.DELETED: return UserStatus.DELETED;
            case STATUS.UNVERIFIED: return UserStatus.UNVERIFIED;
            default: return UserStatus.UNVERIFIED;
        }
    }
}

// Import ROLE and STATUS enums from generated Prisma
import { ROLE, STATUS } from '@/generated/prisma/enums.js';
