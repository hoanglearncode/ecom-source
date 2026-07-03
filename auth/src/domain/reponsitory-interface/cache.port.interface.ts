/**
 * Cache Port Interface
 *
 * Được sử dụng cho caching user data, session tokens, v.v.
 * Implementation có thể là Redis, Memcached, InMemory...
 */
export interface ICachePort {
    /**
     * Lấy giá trị từ cache
     * @param key - Cache key
     * @returns Giá trị đã cache hoặc null nếu không tồn tại
     */
    get<T>(key: string): Promise<T | null>;

    /**
     * Lưu giá trị vào cache
     * @param key - Cache key
     * @param value - Giá trị cần lưu
     * @param ttl - Time to live (giây), optional
     */
    set<T>(key: string, value: T, ttl?: number): Promise<void>;

    /**
     * Xóa một key
     */
    delete(key: string): Promise<void>;

    /**
     * Xóa nhiều key theo pattern
     * @param pattern - Pattern để match keys (VD: "user:*", "session:*")
     */
    deletePattern(pattern: string): Promise<void>;

    /**
     * Kiểm tra key是否存在
     */
    exists(key: string): Promise<boolean>;

    /**
     * Set TTL cho một key đang tồn tại
     */
    expire(key: string, ttl: number): Promise<void>;

    /**
     * Lấy TTL còn lại của key
     * @returns TTL còn lại (giây) hoặc -1 nếu key không có TTL, -2 nếu không tồn tại
     */
    ttl(key: string): Promise<number>;
}

/**
 * Cache Options
 */
export interface CacheOptions {
    /**
     * Time to live mặc định (giây)
     */
    defaultTTL?: number;

    /**
     * Prefix cho tất cả keys
     */
    keyPrefix?: string;
}
