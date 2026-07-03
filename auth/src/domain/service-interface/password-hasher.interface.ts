/**
 * Password Hasher Service Interface
 * Defines contract for password hashing and verification
 */

export interface IPasswordHasher {
    /**
     * Hash a plain text password
     * @param password - Plain text password
     * @returns Hashed password
     */
    hash(password: string): Promise<string>;

    /**
     * Verify a password against a hash
     * @param password - Plain text password to verify
     * @param hash - Hash to compare against
     * @returns True if password matches hash
     */
    verify(password: string, hash: string): Promise<boolean>;

    /**
     * Check if hash needs rehashing (algorithm parameters changed)
     * @param hash - Hash to check
     * @returns True if hash should be rehashed
     */
    needsRehash(hash: string): Promise<boolean>;

    /**
     * Get hash strength info
     * @param hash - Hash to analyze
     * @returns Strength information
     */
    getStrengthInfo(hash: string): {
        algorithm: string;
        rounds: number;
        saltLength: number;
    };
}
