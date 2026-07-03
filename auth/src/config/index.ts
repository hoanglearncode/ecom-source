import { config } from 'dotenv';

export class AuthConfig {
    public readonly version: string;
    public readonly PORT: number;
    public readonly NODE_ENV: string;
    public readonly REDIS_URI: string;
    public readonly JWT_ACCESS_SECRET: string;
    public readonly JWT_REFRESH_SECRET: string;
    public readonly ACCESS_TOKEN_EXPIRES_IN: string;
    public readonly REFRESH_TOKEN_EXPIRES_IN: string;
    public readonly DATABASE_URL: string;

    constructor() {
        config();
        config();
        this.PORT = parseInt(process.env.PORT as string) || 8081;
        this.NODE_ENV = process.env.NODE_ENV || 'development';
        this.REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
        this.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';
        this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
        this.ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
        this.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
        this.version = process.env.VERSION || '1.0.0';
        this.DATABASE_URL =
            process.env.DATABASE_URL || 'postgresql://user:password@url:port/dbname';
    }
}

export const authConfig = new AuthConfig();
