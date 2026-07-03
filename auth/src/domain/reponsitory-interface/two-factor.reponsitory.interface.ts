/**
 * Two-Factor Authentication Repository Interface
 */

import { TwoFactor, TwoFactorType, type TwoFactorProps, type CreateTwoFactorData } from '@/domain/entity/twoFactor.entity.js';

export interface ITwoFactorRepository {
    /**
     * Find 2FA by user ID
     */
    findByUserId(userId: string): Promise<TwoFactor | null>;

    /**
     * Create new 2FA configuration
     */
    create(data: CreateTwoFactorData): Promise<TwoFactor>;

    /**
     * Update 2FA configuration
     */
    update(id: string, data: Partial<TwoFactorProps>): Promise<TwoFactor | null>;

    /**
     * Delete 2FA configuration
     */
    delete(id: string): Promise<boolean>;

    /**
     * Enable 2FA
     */
    enable(userId: string): Promise<boolean>;

    /**
     * Disable 2FA
     */
    disable(userId: string): Promise<boolean>;

    /**
     * Verify setup
     */
    verifySetup(userId: string): Promise<boolean>;

    /**
     * Update secret
     */
    updateSecret(userId: string, secret: string): Promise<boolean>;

    /**
     * Update backup codes
     */
    updateBackupCodes(userId: string, codes: string[]): Promise<boolean>;

    /**
     * Use backup code
     */
    useBackupCode(userId: string, code: string): Promise<boolean>;

    /**
     * Check if 2FA is enabled
     */
    isEnabled(userId: string): Promise<boolean>;

    /**
     * Get remaining backup codes count
     */
    getBackupCodesCount(userId: string): Promise<number>;

    /**
     * Get all users with 2FA enabled
     */
    findEnabled(): Promise<TwoFactor[]>;

    /**
     * Delete by user ID
     */
    deleteByUserId(userId: string): Promise<boolean>;
}
