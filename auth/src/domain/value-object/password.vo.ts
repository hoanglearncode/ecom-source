/**
 * Password Value Object
 * Encapsulates password validation and business rules
 */

import { UserError } from '../domain-error/index.js';

export class Password {
    private readonly value: string;
    private readonly hash: string;
    private static readonly MIN_LENGTH = 8;
    private static readonly MAX_LENGTH = 128;

    // Password complexity requirements
    private static readonly REQUIRE_UPPERCASE = true;
    private static readonly REQUIRE_LOWERCASE = true;
    private static readonly REQUIRE_NUMBER = true;
    private static readonly REQUIRE_SPECIAL = true;

    // Common weak passwords to reject
    private static readonly COMMON_PASSWORDS = [
        'password',
        '12345678',
        '123456789',
        'qwerty123',
        'abc12345',
        'football',
        'monkey123',
        'letmein123',
        'master123',
        'dragon123',
        'password1',
        'welcome1',
        'login123',
        'admin123',
    ];

    private constructor(password: string, hash?: string) {
        this.value = password;
        this.hash = hash || '';
    }

    /**
     * Create a new Password value object from plain text
     * @throws {UserError} If password is invalid
     */
    static create(password: string): Password {
        if (!password || typeof password !== 'string') {
            throw new UserError('USER_PASSWORD_REQUIRED', 'Password is required', 400);
        }

        if (password.length < this.MIN_LENGTH) {
            throw new UserError(
                'USER_PASSWORD_TOO_SHORT',
                `Password must be at least ${this.MIN_LENGTH} characters`,
                400,
            );
        }

        if (password.length > this.MAX_LENGTH) {
            throw new UserError(
                'USER_PASSWORD_TOO_LONG',
                `Password must not exceed ${this.MAX_LENGTH} characters`,
                400,
            );
        }

        // Check for common passwords
        if (this.COMMON_PASSWORDS.includes(password.toLowerCase())) {
            throw new UserError(
                'USER_PASSWORD_TOO_COMMON',
                'Password is too common. Please choose a stronger password',
                400,
            );
        }

        // Validate password strength
        this.validateStrength(password);

        return new Password(password);
    }

    /**
     * Create Password from hash (for database retrieval)
     */
    static fromHash(hash: string): Password {
        return new Password('', hash);
    }

    /**
     * Validate password strength
     */
    private static validateStrength(password: string): void {
        const errors: string[] = [];

        if (this.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
            errors.push('uppercase letter');
        }

        if (this.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
            errors.push('lowercase letter');
        }

        if (this.REQUIRE_NUMBER && !/\d/.test(password)) {
            errors.push('number');
        }

        if (this.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('special character');
        }

        if (errors.length > 0) {
            const message = `Password must contain at least: ${errors.join(', ')}`;
            throw new UserError('USER_PASSWORD_TOO_WEAK', message, 400);
        }

        // Check for sequential characters
        if (this.hasSequentialChars(password)) {
            throw new UserError(
                'USER_PASSWORD_SEQUENTIAL',
                'Password must not contain sequential characters (e.g., 1234, abcd)',
                400,
            );
        }

        // Check for repeated characters
        if (this.hasRepeatedChars(password)) {
            throw new UserError(
                'USER_PASSWORD_REPEATED',
                'Password must not contain repeated characters (e.g., aaa, 111)',
                400,
            );
        }
    }

    /**
     * Check for sequential characters
     */
    private static hasSequentialChars(password: string): boolean {
        for (let i = 0; i < password.length - 2; i++) {
            const char1 = password.charCodeAt(i);
            const char2 = password.charCodeAt(i + 1);
            const char3 = password.charCodeAt(i + 2);

            // Check for sequential (both increasing and decreasing)
            if (Math.abs(char1 - char2) === 1 && Math.abs(char2 - char3) === 1) {
                if ((char1 < char2 && char2 < char3) || (char1 > char2 && char2 > char3)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Check for repeated characters
     */
    private static hasRepeatedChars(password: string): boolean {
        return /(.)\1{2,}/.test(password);
    }

    /**
     * Get the password value (plain text)
     * WARNING: Use sparingly, prefer hashing
     */
    getValue(): string {
        return this.value;
    }

    /**
     * Get the password hash
     */
    getHash(): string {
        return this.hash;
    }

    /**
     * Set the hash (after hashing with password hasher)
     */
    setHash(hash: string): void {
        this.hash;
    }

    /**
     * Check if password matches hash
     * This requires the hash to be set externally
     */
    async matches(compareHash: string): Promise<boolean> {
        // This is a placeholder - actual comparison would use bcrypt.compare
        // In production, inject IPasswordHasher dependency
        return this.hash === compareHash;
    }

    /**
     * Calculate password strength score (0-100)
     */
    getStrengthScore(): number {
        let score = 0;

        // Length contribution
        score += Math.min(this.value.length * 4, 40);

        // Character variety
        if (/[a-z]/.test(this.value)) score += 10;
        if (/[A-Z]/.test(this.value)) score += 10;
        if (/\d/.test(this.value)) score += 10;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(this.value)) score += 15;

        // Complexity bonus
        if (this.value.length >= 12) score += 5;
        if (this.value.length >= 16) score += 10;

        return Math.min(score, 100);
    }

    /**
     * Get password strength label
     */
    getStrengthLabel(): 'weak' | 'fair' | 'good' | 'strong' {
        const score = this.getStrengthScore();

        if (score < 40) return 'weak';
        if (score < 60) return 'fair';
        if (score < 80) return 'good';
        return 'strong';
    }

    /**
     * Convert to string (for logging only - never log actual passwords!)
     */
    toString(): string {
        return '[REDACTED]';
    }

    /**
     * Convert to JSON (excludes actual value for security)
     */
    toJSON(): { strength: string; score: number } {
        return {
            strength: this.getStrengthLabel(),
            score: this.getStrengthScore(),
        };
    }

    /**
     * Check equality with another password
     */
    equals(other: Password): boolean {
        return this.value === other.value;
    }
}

/**
 * Hashed Password - represents a password that has been hashed
 */
export class HashedPassword {
    private readonly value: string;

    private constructor(hash: string) {
        this.value = hash;
    }

    /**
     * Create from a hash string
     */
    static fromHash(hash: string): HashedPassword {
        if (!hash || typeof hash !== 'string') {
            throw new UserError('USER_HASH_REQUIRED', 'Password hash is required', 400);
        }

        return new HashedPassword(hash);
    }

    /**
     * Get the hash value
     */
    getValue(): string {
        return this.value;
    }

    /**
     * Convert to string
     */
    toString(): string {
        return this.value;
    }

    /**
     * Convert to JSON
     */
    toJSON(): string {
        return this.value;
    }
}
