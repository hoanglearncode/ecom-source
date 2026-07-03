/**
 * User Verification Repository Interface
 * Handles email/SMS verification tokens and OTPs
 */

import { VERIFY_TYPE } from '@/generated/prisma/enums.js';

export interface IUserVerifyRepository {
    /**
     * Find verification by token
     */
    findByToken(token: string): Promise<{
        id: string;
        userId: string;
        type: VERIFY_TYPE;
        token: string | null;
        otpHash: string | null;
        attempts: number;
        isUsed: boolean;
        expiresAt: Date;
        createdAt: Date;
        usedAt: Date | null;
    } | null>;

    /**
     * Find verification by user ID and type
     */
    findByUserAndType(userId: string, type: VERIFY_TYPE): Promise<{
        id: string;
        userId: string;
        type: VERIFY_TYPE;
        token: string | null;
        otpHash: string | null;
        attempts: number;
        isUsed: boolean;
        expiresAt: Date;
        createdAt: Date;
        usedAt: Date | null;
    } | null>;

    /**
     * Create email verification token
     */
    createEmailToken(userId: string, type: VERIFY_TYPE, token: string, expiresIn: number): Promise<string>;

    /**
     * Create OTP verification
     */
    createOTP(userId: string, type: VERIFY_TYPE, otpHash: string, expiresIn: number): Promise<string>;

    /**
     * Mark verification as used
     */
    markAsUsed(id: string): Promise<boolean>;

    /**
     * Mark verification as used by token
     */
    markAsUsedByToken(token: string): Promise<boolean>;

    /**
     * Increment attempt count
     */
    incrementAttempts(id: string): Promise<number>;

    /**
     * Increment attempts by token
     */
    incrementAttemptsByToken(token: string): Promise<number>;

    /**
     * Delete verification
     */
    delete(id: string): Promise<boolean>;

    /**
     * Delete by token
     */
    deleteByToken(token: string): Promise<boolean>;

    /**
     * Delete by user and type
     */
    deleteByUserAndType(userId: string, type: VERIFY_TYPE): Promise<number>;

    /**
     * Delete expired verifications
     */
    deleteExpired(): Promise<number>;

    /**
     * Delete used verifications older than specified date
     */
    deleteUsedOlderThan(date: Date): Promise<number>;

    /**
     * Get remaining attempts
     */
    getRemainingAttempts(token: string): Promise<number>;

    /**
     * Check if token is valid
     */
    isTokenValid(token: string): Promise<boolean>;

    /**
     * Check if OTP is valid
     */
    isOTPValid(userId: string, otpHash: string, type: VERIFY_TYPE): Promise<boolean>;

    /**
     * Get all pending verifications for user
     */
    findPendingByUser(userId: string): Promise<Array<{
        id: string;
        type: VERIFY_TYPE;
        expiresAt: Date;
        attempts: number;
    }>>;

    /**
     * Clean up old verifications
     */
    cleanup(olderThanDays: number): Promise<number>;
}
