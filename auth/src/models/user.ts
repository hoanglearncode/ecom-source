import { MongoClient, Db, Collection } from 'mongodb';
import { createClient } from 'redis';
import { User, CreateUserDto } from '../types/index.js';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_db';
const redisUri = process.env.REDIS_URI || 'redis://localhost:6379';

let mongoClient: MongoClient | null = null;
let redisClient: ReturnType<typeof createClient> | null = null;
let userCollection: Collection<User> | null = null;

/**
 * Get MongoDB client and user collection (singleton)
 */
const getMongoCollection = async (): Promise<Collection<User>> => {
  if (!mongoClient) {
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const db: Db = mongoClient.db();
    userCollection = db.collection<User>('users');
  }
  return userCollection!;
};

/**
 * Get Redis client (singleton)
 */
const getRedisClient = async (): Promise<ReturnType<typeof createClient>> => {
  if (!redisClient) {
    redisClient = createClient({ url: redisUri });
    redisClient.on('error', (err) => console.error('Redis Error:', err));
    await redisClient.connect();
  }
  return redisClient;
};

/**
 * User Model
 */
export const UserModel = {
  /**
   * Find user by email
   * @param email - User email
   * @returns User document or null
   */
  async findByEmail(email: string): Promise<User | null> {
    const collection = await getMongoCollection();
    return await collection.findOne({ email });
  },

  /**
   * Find user by ID
   * @param userId - User ID
   * @returns User document without password or null
   */
  async findById(userId: string): Promise<Omit<User, 'password'> | null> {
    const collection = await getMongoCollection();
    const user = await collection.findOne({ userId });

    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },

  /**
   * Create new user
   * @param userData - User data to create
   * @returns Created user without password
   */
  async create(userData: User & CreateUserDto): Promise<Omit<User, 'password'>> {
    const collection = await getMongoCollection();
    await collection.insertOne(userData);
    const { password, ...userWithoutPassword } = userData;
    return userWithoutPassword;
  },

  /**
   * Update user
   * @param userId - User ID
   * @param updates - Fields to update
   */
  async update(userId: string, updates: Partial<User>): Promise<void> {
    const collection = await getMongoCollection();
    await collection.updateOne(
      { userId },
      { $set: { ...updates, updatedAt: new Date() } }
    );
  },

  /**
   * Store refresh token in Redis
   * @param userId - User ID
   * @param refreshToken - Refresh token to store
   */
  async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const client = await getRedisClient();
    const tokenKey = `refresh:${userId}:${Date.now()}`;
    // Store for 7 days (604800 seconds)
    await client.setEx(tokenKey, 604800, refreshToken);

    // Also keep track of user's tokens for easy removal
    await client.sAdd(`user_tokens:${userId}`, tokenKey);
  },

  /**
   * Verify refresh token exists
   * @param userId - User ID
   * @param refreshToken - Refresh token to verify
   * @returns true if token exists and is valid
   */
  async verifyRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const client = await getRedisClient();
    const tokenKeys = await client.sMembers(`user_tokens:${userId}`);

    for (const key of tokenKeys) {
      const storedToken = await client.get(key);
      if (storedToken === refreshToken) {
        return true;
      }
    }
    return false;
  },

  /**
   * Remove specific refresh token
   * @param userId - User ID
   * @param refreshToken - Refresh token to remove
   */
  async removeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const client = await getRedisClient();
    const tokenKeys = await client.sMembers(`user_tokens:${userId}`);

    for (const key of tokenKeys) {
      const storedToken = await client.get(key);
      if (storedToken === refreshToken) {
        await client.del(key);
        await client.sRem(`user_tokens:${userId}`, key);
        break;
      }
    }
  },

  /**
   * Remove all refresh tokens for user
   * @param userId - User ID
   */
  async removeAllRefreshTokens(userId: string): Promise<void> {
    const client = await getRedisClient();
    const tokenKeys = await client.sMembers(`user_tokens:${userId}`);

    if (tokenKeys.length > 0) {
      await client.del(...tokenKeys);
      await client.del(`user_tokens:${userId}`);
    }
  },

  /**
   * Close all connections
   */
  async closeConnections(): Promise<void> {
    if (mongoClient) {
      await mongoClient.close();
      mongoClient = null;
      userCollection = null;
    }
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
    }
  }
};
