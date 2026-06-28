import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Get Redis client (singleton)
 */
const getRedisClient = async (): Promise<ReturnType<typeof createClient>> => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URI || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
  }
  return redisClient;
};

/**
 * Token Blacklist Utility
 * Stores revoked access tokens in Redis until they expire
 */
export const TokenBlacklist = {
  /**
   * Add token to blacklist
   * @param token - JWT token
   * @param expiresIn - Expiration time in seconds
   */
  async addToBlacklist(token: string, expiresIn: number): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = `bl:${token}`;
      await client.setEx(key, expiresIn, '1');
    } catch (error) {
      console.error('Failed to blacklist token:', error);
    }
  },

  /**
   * Check if token is blacklisted
   * @param token - JWT token
   * @returns true if blacklisted, false otherwise
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      const key = `bl:${token}`;
      const result = await client.get(key);
      return result !== null;
    } catch (error) {
      console.error('Failed to check blacklist:', error);
      return false;
    }
  },

  /**
   * Remove all tokens for a user (full logout from all devices)
   * @param userId - User ID
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      const client = await getRedisClient();
      // Get all user refresh tokens and remove them
      const pattern = `refresh:${userId}:*`;
      const keys = await client.keys(pattern);

      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error('Failed to revoke user tokens:', error);
    }
  }
};

/**
 * Close Redis connection
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
