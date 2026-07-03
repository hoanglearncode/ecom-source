/**
 * Email Value Object
 * Encapsulates email validation and business rules
 */

import { UserError } from '../domain-error/index.js';

export class Email {
    private readonly value: string;
    private static readonly EMAIL_REGEX =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    private constructor(email: string) {
        this.value = email.toLowerCase().trim();
    }

    /**
     * Create a new Email value object
     * @throws {UserError} If email is invalid
     */
    static create(email: string): Email {
        if (!email || typeof email !== 'string') {
            throw UserError.INVALID_EMAIL;
        }

        const trimmed = email.trim();

        if (trimmed.length === 0) {
            throw UserError.INVALID_EMAIL;
        }

        if (trimmed.length > 255) {
            throw new UserError('USER_EMAIL_TOO_LONG', 'Email must not exceed 255 characters', 400);
        }

        if (!this.EMAIL_REGEX.test(trimmed)) {
            throw UserError.INVALID_EMAIL;
        }

        return new Email(trimmed);
    }

    /**
     * Create Email without validation (for internal use)
     */
    static fromValid(email: string): Email {
        return new Email(email);
    }

    /**
     * Get the email value
     */
    getValue(): string {
        return this.value;
    }

    /**
     * Get the local part (before @)
     */
    getLocal(): string {
        return this.value.split('@')[0];
    }

    /**
     * Get the domain part (after @)
     */
    getDomain(): string {
        return this.value.split('@')[1];
    }

    /**
     * Check if email is from a specific domain
     */
    isFromDomain(domain: string): boolean {
        return this.getDomain() === domain.toLowerCase();
    }

    /**
     * Check if this is a corporate email (not from common free providers)
     */
    isCorporate(): boolean {
        const freeDomains = [
            'gmail.com',
            'yahoo.com',
            'hotmail.com',
            'outlook.com',
            'aol.com',
            'icloud.com',
            'protonmail.com',
            'yandex.com',
            'mail.ru',
            'qq.com',
        ];

        return !freeDomains.includes(this.getDomain());
    }

    /**
     * Mask email for display (e.g., j***@example.com)
     */
    mask(): string {
        const [local, domain] = this.value.split('@');
        if (local.length <= 2) {
            return `${local[0]}***@${domain}`;
        }
        return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
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

    /**
     * Check equality
     */
    equals(other: Email): boolean {
        return this.value === other.value;
    }
}
