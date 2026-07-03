/**
 * User Repository Interface
 * Defines the contract for user data persistence operations
 */

import { UserEntity, UserRole, UserStatus, type UserProps, type CreateUserData, type UpdateUserData } from '@/domain/entity/index.js';

// ============================================================
// User Repository Interface
// ============================================================

export interface IUserRepository {
    // ============================================================
    // CRUD Operations
    // ============================================================

    /**
     * Find user by ID
     */
    findById(id: string): Promise<UserEntity | null>;

    /**
     * Find user by email
     */
    findByEmail(email: string): Promise<UserEntity | null>;

    /**
     * Find user by phone
     */
    findByPhone(phone: string): Promise<UserEntity | null>;

    /**
     * Find user by username
     */
    findByUsername(username: string): Promise<UserEntity | null>;

    /**
     * Find user by email or username (for login)
     */
    findByEmailOrUsername(emailOrUsername: string): Promise<UserEntity | null>;

    /**
     * Find user by email or phone
     */
    findByEmailOrPhone(emailOrPhone: string): Promise<UserEntity | null>;

    /**
     * Check if email exists
     */
    emailExists(email: string): Promise<boolean>;

    /**
     * Check if phone exists
     */
    phoneExists(phone: string): Promise<boolean>;

    /**
     * Check if username exists
     */
    usernameExists(username: string): Promise<boolean>;

    /**
     * Create new user
     */
    create(data: CreateUserData): Promise<UserEntity>;

    /**
     * Update user
     */
    update(id: string, data: UpdateUserData): Promise<UserEntity | null>;

    /**
     * Delete user (soft delete)
     */
    delete(id: string): Promise<boolean>;

    /**
     * Permanently delete user
     */
    hardDelete(id: string): Promise<boolean>;

    /**
     * Restore soft-deleted user
     */
    restore(id: string): Promise<UserEntity | null>;

    // ============================================================
    // Bulk Operations
    // ============================================================

    /**
     * Find multiple users by IDs
     */
    findByIds(ids: string[]): Promise<UserEntity[]>;

    /**
     * Get all users with pagination
     */
    findAll(options?: {
        skip?: number;
        take?: number;
        orderBy?: { field: keyof UserProps; direction: 'asc' | 'desc' };
        where?: {
            status?: UserStatus[];
            role?: UserRole[];
        };
    }): Promise<{ users: UserEntity[]; total: number }>;

    /**
     * Count users by criteria
     */
    count(criteria?: {
        status?: UserStatus;
        role?: UserRole;
    }): Promise<number>;

    // ============================================================
    // Status & Role Operations
    // ============================================================

    /**
     * Update user status
     */
    updateStatus(id: string, status: UserStatus): Promise<boolean>;

    /**
     * Update user role
     */
    updateRole(id: string, role: UserRole): Promise<boolean>;

    /**
     * Get users by status
     */
    findByStatus(status: UserStatus): Promise<UserEntity[]>;

    /**
     * Get users by role
     */
    findByRole(role: UserRole): Promise<UserEntity[]>;

    // ============================================================
    // Security Operations
    // ============================================================

    /**
     * Increment failed login count
     */
    incrementFailedLoginCount(id: string): Promise<UserEntity | null>;

    /**
     * Reset failed login count
     */
    resetFailedLoginCount(id: string): Promise<boolean>;

    /**
     * Lock user account until specific date
     */
    lockAccount(id: string, lockedUntil: Date): Promise<boolean>;

    /**
     * Unlock user account
     */
    unlockAccount(id: string): Promise<boolean>;

    /**
     * Update last login info
     */
    updateLastLogin(id: string, ip: string, loginAt?: Date): Promise<boolean>;

    /**
     * Update password hash
     */
    updatePassword(id: string, passwordHash: string): Promise<boolean>;

    /**
     * Mark user as verified
     */
    markAsVerified(id: string): Promise<boolean>;

    /**
     * Get users with expired/unverified accounts
     */
    findUnverifiedUsers(olderThanDays: number): Promise<UserEntity[]>;

    // ============================================================
    // Transaction Operations
    // ============================================================

    /**
     * Execute operation within transaction
     */
    transaction<T>(callback: (tx: any) => Promise<T>): Promise<T>;
}

// ============================================================
// Admin/User Specific Operations Interface
// ============================================================

export interface IAdminUserRepository extends IUserRepository {
    /**
     * Get all banned users
     */
    findBannedUsers(): Promise<UserEntity[]>;

    /**
     * Get all deleted users
     */
    findDeletedUsers(): Promise<UserEntity[]>;

    /**
     * Ban user
     */
    banUser(id: string, reason?: string): Promise<boolean>;

    /**
     * Unban user
     */
    unbanUser(id: string): Promise<boolean>;

    /**
     * Get user statistics
     */
    getStatistics(): Promise<{
        total: number;
        active: number;
        unverified: number;
        banned: number;
        deleted: number;
    }>;
}
