/**
 * Bcrypt Password Hasher Implementation
 */

import { injectable } from 'inversify';
import { IPasswordHasher } from '@/domain/service-interface/password-hasher.interface.js';
import bcrypt from 'bcrypt';

@injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
    private readonly SALT_ROUNDS = 12;

    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }

    async verify(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    async needsRehash(hash: string): Promise<boolean> {
        // Extract rounds from hash
        const match = hash.match(/^\$2[aby]\$(\d+)\$/);
        if (!match) return true;
        const rounds = parseInt(match[1], 10);
        return rounds < this.SALT_ROUNDS;
    }

    getStrengthInfo(hash: string): {
        algorithm: string;
        rounds: number;
        saltLength: number;
    } {
        const match = hash.match(/^\$2([aby])\$(\d+)\$/);
        if (!match) {
            return {
                algorithm: 'unknown',
                rounds: 0,
                saltLength: 0,
            };
        }

        const variant = match[1];
        const rounds = parseInt(match[2], 10);

        let algorithm = 'bcrypt';
        if (variant === 'a') algorithm = 'bcrypt-a';
        if (variant === 'y') algorithm = 'bcrypt-y';

        return {
            algorithm,
            rounds,
            saltLength: 16, // bcrypt uses 128-bit salt (16 bytes)
        };
    }
}
