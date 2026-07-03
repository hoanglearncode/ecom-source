import { PrismaClient } from '@/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { injectable } from 'inversify';
import { logger } from '@/shared/logger/index.js';
import { authConfig } from '@/config/index.js';

/**
 * Prisma Service
 * Singleton service for Prisma client
 */
@injectable()
export class PrismaService {
    private static instance: PrismaService | null = null;
    public readonly client: PrismaClient;

    private constructor() {
        logger.info('Setting up Prisma Client');

        const adapter = new PrismaPg({
            connectionString: authConfig.DATABASE_URL || process.env.DATABASE_URL,
        });

        this.client = new PrismaClient({
            adapter,
            log: authConfig.NODE_ENV === 'development'
                ? [
                    { emit: 'event', level: 'query' },
                    { emit: 'stdout', level: 'warn' },
                    { emit: 'stdout', level: 'error' },
                ]
                : [{ emit: 'stdout', level: 'error' }],
        });
        // Graceful shutdown
        process.on('beforeExit', async () => {
            await this.client.$disconnect();
        });

        logger.info('Prisma Client setup completed successfully');
    }

    static getInstance(): PrismaService {
        if (!PrismaService.instance) {
            PrismaService.instance = new PrismaService();
        }
        return PrismaService.instance;
    }

    /**
     * Execute operation within transaction
     */

    /**
     * Health check
     */
    async healthCheck(): Promise<boolean> {
        try {
            await this.client.$queryRaw`SELECT 1`;
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Disconnect client
     */
    async disconnect(): Promise<void> {
        await this.client.$disconnect();
    }
}

// Export a singleton instance for backward compatibility
export let prismaClient: PrismaClient;

export const setUpPrismaClient = (): PrismaClient => {
    const service = PrismaService.getInstance();
    prismaClient = service.client;
    return prismaClient;
};
