/**
 * JWT Token Generator Implementation
 */

import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import { ITokenGenerator, TokenPayload, TokenOptions } from '@/domain/service-interface/token-generator.interface.js';
import { authConfig } from '@/config/index.js';

@injectable()
export class JwtTokenGenerator implements ITokenGenerator {
    private readonly ACCESS_TOKEN_SECRET: string;
    private readonly REFRESH_TOKEN_SECRET: string;
    private readonly ACCESS_TOKEN_EXPIRES_IN: string;
    private readonly REFRESH_TOKEN_EXPIRES_IN: string;
    private readonly ISSUER: string;

    constructor() {
        this.ACCESS_TOKEN_SECRET = authConfig.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET || 'access-secret';
        this.REFRESH_TOKEN_SECRET = authConfig.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || 'refresh-secret';
        this.ACCESS_TOKEN_EXPIRES_IN = authConfig.ACCESS_TOKEN_EXPIRES_IN || process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
        this.REFRESH_TOKEN_EXPIRES_IN = authConfig.REFRESH_TOKEN_EXPIRES_IN || process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
        this.ISSUER = process.env.JWT_ISSUER || 'ecom-auth';
    }

    generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, options?: TokenOptions): string {
        const fullPayload: TokenPayload = {
            ...payload,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.parseExpiresIn(options?.expiresIn || this.ACCESS_TOKEN_EXPIRES_IN),
        };

        return jwt.sign(fullPayload, this.ACCESS_TOKEN_SECRET, {
            issuer: options?.issuer || this.ISSUER,
            subject: options?.subject || payload.sub,
            audience: options?.audience,
            jwtid: payload.jti || this.generateJti(),
        });
    }

    generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, options?: TokenOptions): string {
        const fullPayload: TokenPayload = {
            ...payload,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.parseExpiresIn(options?.expiresIn || this.REFRESH_TOKEN_EXPIRES_IN),
        };

        return jwt.sign(fullPayload, this.REFRESH_TOKEN_SECRET, {
            issuer: options?.issuer || this.ISSUER,
            subject: options?.subject || payload.sub,
            audience: options?.audience,
            jwtid: payload.jti || this.generateJti(),
        });
    }

    verify(token: string): TokenPayload {
        // Try access token secret first
        try {
            return jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
                issuer: this.ISSUER,
            }) as TokenPayload;
        } catch {
            // Try refresh token secret
            return jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
                issuer: this.ISSUER,
            }) as TokenPayload;
        }
    }

    decode(token: string): TokenPayload | null {
        try {
            const decoded = jwt.decode(token) as TokenPayload;
            return decoded;
        } catch {
            return null;
        }
    }

    getJti(token: string): string | null {
        const decoded = this.decode(token);
        return decoded?.jti || null;
    }

    getUserId(token: string): string | null {
        const decoded = this.decode(token);
        return decoded?.sub || null;
    }

    isExpired(token: string): boolean {
        const decoded = this.decode(token);
        if (!decoded) return true;

        const now = Math.floor(Date.now() / 1000);
        return decoded.exp < now;
    }

    getExpiration(token: string): Date | null {
        const decoded = this.decode(token);
        if (!decoded) return null;

        return new Date(decoded.exp * 1000);
    }

    getIssuedAt(token: string): Date | null {
        const decoded = this.decode(token);
        if (!decoded) return null;

        return new Date(decoded.iat * 1000);
    }

    generateJti(): string {
        return crypto.randomUUID();
    }

    /**
     * Parse expires in string to seconds
     */
    private parseExpiresIn(expiresIn: string | number): number {
        if (typeof expiresIn === 'number') {
            return expiresIn;
        }

        const match = expiresIn.toString().match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error(`Invalid expiration format: ${expiresIn}`);
        }

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 3600;
            case 'd':
                return value * 86400;
            default:
                throw new Error(`Invalid expiration unit: ${unit}`);
        }
    }
}
