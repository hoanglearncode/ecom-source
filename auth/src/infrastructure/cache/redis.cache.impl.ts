/**
 * Redis Cache Implementation
 */

import { injectable } from 'inversify';
import { createClient, RedisClientType } from 'redis';
import { ICacheService } from '@/domain/service-interface/cache.interface.js';
import { authConfig } from '@/config/index.js';
import { logger } from '@/shared/logger/index.js';

@injectable()
export class RedisCache implements ICacheService {
    private client: RedisClientType;
    private connected: boolean = false;

    constructor() {
        this.client = createClient({
            url: authConfig.REDIS_URI || process.env.REDIS_URI || 'redis://localhost:6379',
        });

        this.client.on('error', (err) => {
            logger.error('Redis Client Error', { error: err.message });
        });

        this.client.on('connect', () => {
            logger.info('Redis Client Connected');
            this.connected = true;
        });

        this.client.on('disconnect', () => {
            logger.warn('Redis Client Disconnected');
            this.connected = false;
        });
    }

    private async ensureConnected(): Promise<void> {
        if (!this.connected) {
            await this.client.connect();
        }
    }

    // ============================================================
    // String Operations
    // ============================================================

    async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
        try {
            await this.ensureConnected();
            const serialized = JSON.stringify(value);
            if (ttl) {
                await this.client.setEx(key, ttl, serialized);
            } else {
                await this.client.set(key, serialized);
            }
            return true;
        } catch (error) {
            logger.error('Redis SET error', { error, key });
            return false;
        }
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            await this.ensureConnected();
            const value = await this.client.get(key);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            logger.error('Redis GET error', { error, key });
            return null;
        }
    }

    async del(key: string): Promise<boolean> {
        try {
            await this.ensureConnected();
            const result = await this.client.del(key);
            return result > 0;
        } catch (error) {
            logger.error('Redis DEL error', { error, key });
            return false;
        }
    }

    async delMultiple(keys: string[]): Promise<number> {
        try {
            await this.ensureConnected();
            return await this.client.del(keys);
        } catch (error) {
            logger.error('Redis DEL multiple error', { error });
            return 0;
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            await this.ensureConnected();
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            logger.error('Redis EXISTS error', { error, key });
            return false;
        }
    }

    async expire(key: string, ttl: number): Promise<boolean> {
        try {
            await this.ensureConnected();
            const result = await this.client.expire(key, ttl);
            return result === 1;
        } catch (error) {
            logger.error('Redis EXPIRE error', { error, key });
            return false;
        }
    }

    // ============================================================
    // Hash Operations
    // ============================================================

    async hSet(key: string, field: string, value: unknown): Promise<boolean> {
        try {
            await this.ensureConnected();
            await this.client.hSet(key, field, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.error('Redis HSET error', { error, key, field });
            return false;
        }
    }

    async hGet<T>(key: string, field: string): Promise<T | null> {
        try {
            await this.ensureConnected();
            const value = await this.client.hGet(key, field);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            logger.error('Redis HGET error', { error, key, field });
            return null;
        }
    }

    async hGetAll<T>(key: string): Promise<Record<string, T> | null> {
        try {
            await this.ensureConnected();
            const hash = await this.client.hGetAll(key);
            if (Object.keys(hash).length === 0) return null;

            const result: Record<string, T> = {};
            for (const [field, value] of Object.entries(hash)) {
                result[field] = JSON.parse(value) as T;
            }
            return result;
        } catch (error) {
            logger.error('Redis HGETALL error', { error, key });
            return null;
        }
    }

    async hDel(key: string, field: string): Promise<boolean> {
        try {
            await this.ensureConnected();
            const result = await this.client.hDel(key, field);
            return result > 0;
        } catch (error) {
            logger.error('Redis HDEL error', { error, key, field });
            return false;
        }
    }

    async hExists(key: string, field: string): Promise<boolean> {
        try {
            await this.ensureConnected();
            const result = await this.client.hExists(key, field);
            return result === 1;
        } catch (error) {
            logger.error('Redis HEXISTS error', { error, key, field });
            return false;
        }
    }

    // ============================================================
    // List Operations
    // ============================================================

    async lPush(key: string, value: unknown): Promise<number> {
        try {
            await this.ensureConnected();
            return await this.client.lPush(key, JSON.stringify(value));
        } catch (error) {
            logger.error('Redis LPUSH error', { error, key });
            return 0;
        }
    }

    async lPop<T>(key: string): Promise<T | null> {
        try {
            await this.ensureConnected();
            const value = await this.client.lPop(key);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            logger.error('Redis LPOP error', { error, key });
            return null;
        }
    }

    async lRange<T>(key: string, start: number, stop: number): Promise<T[]> {
        try {
            await this.ensureConnected();
            const values = await this.client.lRange(key, start, stop);
            return values.map(v => JSON.parse(v) as T);
        } catch (error) {
            logger.error('Redis LRANGE error', { error, key });
            return [];
        }
    }

    async lLen(key: string): Promise<number> {
        try {
            await this.ensureConnected();
            return await this.client.lLen(key);
        } catch (error) {
            logger.error('Redis LLEN error', { error, key });
            return 0;
        }
    }

    // ============================================================
    // Set Operations
    // ============================================================

    async sAdd(key: string, member: string): Promise<boolean> {
        try {
            await this.ensureConnected();
            const result = await this.client.sAdd(key, member);
            return result > 0;
        } catch (error) {
            logger.error('Redis SADD error', { error, key });
            return false;
        }
    }

    async sRem(key: string, member: string): Promise<boolean> {
        try {
            await this.ensureConnected();
            const result = await this.client.sRem(key, member);
            return result > 0;
        } catch (error) {
            logger.error('Redis SREM error', { error, key });
            return false;
        }
    }

    async sIsMember(key: string, member: string): Promise<boolean> {
        try {
            await this.ensureConnected();
            return await this.client.sIsMember(key, member);
        } catch (error) {
            logger.error('Redis SISMEMBER error', { error, key });
            return false;
        }
    }

    async sMembers(key: string): Promise<string[]> {
        try {
            await this.ensureConnected();
            return await this.client.sMembers(key);
        } catch (error) {
            logger.error('Redis SMEMBERS error', { error, key });
            return [];
        }
    }

    // ============================================================
    // Sorted Set Operations
    // ============================================================

    async zAdd(key: string, score: number, member: string): Promise<boolean> {
        try {
            await this.ensureConnected();
            const result = await this.client.zAdd(key, { score, value: member });
            return result > 0;
        } catch (error) {
            logger.error('Redis ZADD error', { error, key });
            return false;
        }
    }

    async zRangeByScore(key: string, min: number, max: number): Promise<string[]> {
        try {
            await this.ensureConnected();
            return await this.client.zRangeByScore(key, min, max);
        } catch (error) {
            logger.error('Redis ZRANGEBYSCORE error', { error, key });
            return [];
        }
    }

    async zRem(key: string, member: string): Promise<boolean> {
        try {
            await this.ensureConnected();
            const result = await this.client.zRem(key, member);
            return result > 0;
        } catch (error) {
            logger.error('Redis ZREM error', { error, key });
            return false;
        }
    }

    async zScore(key: string, member: string): Promise<number | null> {
        try {
            await this.ensureConnected();
            const score = await this.client.zScore(key, member);
            return score !== null ? score : null;
        } catch (error) {
            logger.error('Redis ZSCORE error', { error, key });
            return null;
        }
    }

    // ============================================================
    // Increment/Decrement Operations
    // ============================================================

    async incr(key: string): Promise<number> {
        try {
            await this.ensureConnected();
            return await this.client.incr(key);
        } catch (error) {
            logger.error('Redis INCR error', { error, key });
            return 0;
        }
    }

    async incrBy(key: string, amount: number): Promise<number> {
        try {
            await this.ensureConnected();
            return await this.client.incrBy(key, amount);
        } catch (error) {
            logger.error('Redis INCRBY error', { error, key });
            return 0;
        }
    }

    async decr(key: string): Promise<number> {
        try {
            await this.ensureConnected();
            return await this.client.decr(key);
        } catch (error) {
            logger.error('Redis DECR error', { error, key });
            return 0;
        }
    }

    async decrBy(key: string, amount: number): Promise<number> {
        try {
            await this.ensureConnected();
            return await this.client.decrBy(key, amount);
        } catch (error) {
            logger.error('Redis DECRBY error', { error, key });
            return 0;
        }
    }

    // ============================================================
    // TTL Operations
    // ============================================================

    async ttl(key: string): Promise<number> {
        try {
            await this.ensureConnected();
            return await this.client.ttl(key);
        } catch (error) {
            logger.error('Redis TTL error', { error, key });
            return -1;
        }
    }

    // ============================================================
    // Pattern Operations
    // ============================================================

    async keys(pattern: string): Promise<string[]> {
        try {
            await this.ensureConnected();
            return await this.client.keys(pattern);
        } catch (error) {
            logger.error('Redis KEYS error', { error, pattern });
            return [];
        }
    }

    async delByPattern(pattern: string): Promise<number> {
        try {
            const keysToDelete = await this.keys(pattern);
            if (keysToDelete.length === 0) return 0;
            return await this.delMultiple(keysToDelete);
        } catch (error) {
            logger.error('Redis DEL by pattern error', { error, pattern });
            return 0;
        }
    }

    // ============================================================
    // Transaction Operations
    // ============================================================

    async transaction<T>(operations: Array<() => Promise<T>>): Promise<T[]> {
        try {
            await this.ensureConnected();
            const multi = this.client.multi();
            const promises = operations.map(op => op());
            return await Promise.all(promises);
        } catch (error) {
            logger.error('Redis TRANSACTION error', { error });
            return [];
        }
    }

    // ============================================================
    // Connection
    // ============================================================

    async ping(): Promise<boolean> {
        try {
            await this.ensureConnected();
            const response = await this.client.ping();
            return response === 'PONG';
        } catch {
            return false;
        }
    }

    async flush(): Promise<boolean> {
        try {
            await this.ensureConnected();
            await this.client.flushDb();
            return true;
        } catch (error) {
            logger.error('Redis FLUSH error', { error });
            return false;
        }
    }

    async close(): Promise<void> {
        try {
            await this.client.quit();
            this.connected = false;
        } catch (error) {
            logger.error('Redis CLOSE error', { error });
        }
    }
}
