/**
 * Cache Service Interface
 * Defines contract for caching operations
 */

export interface ICacheService {
    // ============================================================
    // String Operations
    // ============================================================

    /**
     * Set a value in cache
     * @param key - Cache key
     * @param value - Value to store (will be JSON serialized)
     * @param ttl - Time to live in seconds (optional)
     */
    set(key: string, value: unknown, ttl?: number): Promise<boolean>;

    /**
     * Get a value from cache
     * @param key - Cache key
     * @returns Cached value or null
     */
    get<T>(key: string): Promise<T | null>;

    /**
     * Delete a value from cache
     * @param key - Cache key
     */
    del(key: string): Promise<boolean>;

    /**
     * Delete multiple keys
     * @param keys - Array of cache keys
     */
    delMultiple(keys: string[]): Promise<number>;

    /**
     * Check if key exists
     * @param key - Cache key
     */
    exists(key: string): Promise<boolean>;

    /**
     * Set expiration time for existing key
     * @param key - Cache key
     * @param ttl - Time to live in seconds
     */
    expire(key: string, ttl: number): Promise<boolean>;

    // ============================================================
    // Hash Operations
    // ============================================================

    /**
     * Set field in hash
     * @param key - Hash key
     * @param field - Field name
     * @param value - Field value
     */
    hSet(key: string, field: string, value: unknown): Promise<boolean>;

    /**
     * Get field from hash
     * @param key - Hash key
     * @param field - Field name
     */
    hGet<T>(key: string, field: string): Promise<T | null>;

    /**
     * Get all fields from hash
     * @param key - Hash key
     */
    hGetAll<T>(key: string): Promise<Record<string, T> | null>;

    /**
     * Delete field from hash
     * @param key - Hash key
     * @param field - Field name
     */
    hDel(key: string, field: string): Promise<boolean>;

    /**
     * Check if field exists in hash
     * @param key - Hash key
     * @param field - Field name
     */
    hExists(key: string, field: string): Promise<boolean>;

    // ============================================================
    // List Operations
    // ============================================================

    /**
     * Push value to list (left)
     * @param key - List key
     * @param value - Value to push
     */
    lPush(key: string, value: unknown): Promise<number>;

    /**
     * Pop value from list (left)
     * @param key - List key
     */
    lPop<T>(key: string): Promise<T | null>;

    /**
     * Get list range
     * @param key - List key
     * @param start - Start index
     * @param stop - Stop index
     */
    lRange<T>(key: string, start: number, stop: number): Promise<T[]>;

    /**
     * Get list length
     * @param key - List key
     */
    lLen(key: string): Promise<number>;

    // ============================================================
    // Set Operations
    // ============================================================

    /**
     * Add member to set
     * @param key - Set key
     * @param member - Member to add
     */
    sAdd(key: string, member: string): Promise<boolean>;

    /**
     * Remove member from set
     * @param key - Set key
     * @param member - Member to remove
     */
    sRem(key: string, member: string): Promise<boolean>;

    /**
     * Check if member exists in set
     * @param key - Set key
     * @param member - Member to check
     */
    sIsMember(key: string, member: string): Promise<boolean>;

    /**
     * Get all members of set
     * @param key - Set key
     */
    sMembers(key: string): Promise<string[]>;

    // ============================================================
    // Sorted Set Operations
    // ============================================================

    /**
     * Add member to sorted set with score
     * @param key - Sorted set key
     * @param score - Member score
     * @param member - Member value
     */
    zAdd(key: string, score: number, member: string): Promise<boolean>;

    /**
     * Get members by score range
     * @param key - Sorted set key
     * @param min - Minimum score
     * @param max - Maximum score
     */
    zRangeByScore(key: string, min: number, max: number): Promise<string[]>;

    /**
     * Remove member from sorted set
     * @param key - Sorted set key
     * @param member - Member to remove
     */
    zRem(key: string, member: string): Promise<boolean>;

    /**
     * Get member score
     * @param key - Sorted set key
     * @param member - Member value
     */
    zScore(key: string, member: string): Promise<number | null>;

    // ============================================================
    // Increment/Decrement Operations
    // ============================================================

    /**
     * Increment value by 1
     * @param key - Key to increment
     */
    incr(key: string): Promise<number>;

    /**
     * Increment value by amount
     * @param key - Key to increment
     * @param amount - Amount to increment
     */
    incrBy(key: string, amount: number): Promise<number>;

    /**
     * Decrement value by 1
     * @param key - Key to decrement
     */
    decr(key: string): Promise<number>;

    /**
     * Decrement value by amount
     * @param key - Key to decrement
     * @param amount - Amount to decrement
     */
    decrBy(key: string, amount: number): Promise<number>;

    // ============================================================
    // TTL Operations
    // ============================================================

    /**
     * Get remaining time to live
     * @param key - Cache key
     */
    ttl(key: string): Promise<number>;

    // ============================================================
    // Pattern Operations
    // ============================================================

    /**
     * Find keys by pattern
     * @param pattern - Key pattern (e.g., "user:*")
     */
    keys(pattern: string): Promise<string[]>;

    /**
     * Delete keys by pattern
     * @param pattern - Key pattern
     */
    delByPattern(pattern: string): Promise<number>;

    // ============================================================
    // Transaction Operations
    // ============================================================

    /**
     * Execute multiple operations in transaction
     * @param operations - Array of operations to execute
     */
    transaction<T>(operations: Array<() => Promise<T>>): Promise<T[]>;

    // ============================================================
    // Connection
    // ============================================================

    /**
     * Ping cache server
     */
    ping(): Promise<boolean>;

    /**
     * Flush all cache data
     */
    flush(): Promise<boolean>;

    /**
     * Close connection
     */
    close(): Promise<void>;
}
