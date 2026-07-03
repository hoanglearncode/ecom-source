/**
 * DI Container
 * Dependency Injection Container using InversifyJS
 * Binds all interfaces to their implementations
 */

import { Container, injectable } from 'inversify';
import { TYPES } from './type.js';

// ============================================================
// Import Infrastructure Services
// ============================================================

import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.js';
import { RedisCache } from '@/infrastructure/cache/redis.cache.impl.js';
import { BcryptPasswordHasher } from '@/infrastructure/security/bcrypt.password-hasher.impl.js';
import { JwtTokenGenerator } from '@/infrastructure/security/jwt.token-generator.impl.js';

// ============================================================
// Import Repository Implementations
// ============================================================

import { UserRepository } from '@/infrastructure/persistence/repository/user.repository.js';
import { TokenRepository } from '@/infrastructure/persistence/repository/token.repository.js';
import { TwoFactorRepository } from '@/infrastructure/persistence/repository/two-factor.repository.js';
import { UserVerifyRepository } from '@/infrastructure/persistence/repository/user-verify.repository.js';
import { OAuthAccountRepository } from '@/infrastructure/persistence/repository/oauth-account.repository.js';
import { PasswordHistoryRepository } from '@/infrastructure/persistence/repository/password-history.repository.js';
import { AuditLogRepository } from '@/infrastructure/persistence/repository/audit-log.repository.js';
import { LoginAttemptRepository } from '@/infrastructure/persistence/repository/login-attempt.repository.js';
import { ApiKeyRepository } from '@/infrastructure/persistence/repository/api-key.repository.js';
import { IpBlockRepository } from '@/infrastructure/persistence/repository/ip-block.repository.js';

// ============================================================
// Import Use Cases
// ============================================================

import { AuthUseCase } from '@/application/use-case/auth/index.js';
import { TokenUseCase } from '@/application/use-case/token/index.js';
import { PasswordUseCase } from '@/application/use-case/password/index.js';
import { TwoFactorUseCase } from '@/application/use-case/2fa/index.js';
import { VerifyUseCase } from '@/application/use-case/verify/index.js';
import { OAuthUseCase } from '@/application/use-case/oauth/index.js';
import { SessionUseCase } from '@/application/use-case/session/index.js';
import { ApiKeyUseCase } from '@/application/use-case/api-key/index.js';
import { InternalUseCase } from '@/application/use-case/internal/index.js';

// ============================================================
// Container Class
// ============================================================

@injectable()
export class DIContainer {
    private static instance: DIContainer | null = null;
    private readonly container: Container;

    private constructor() {
        this.container = new Container({
            defaultScope: 'Singleton',
        });
        this.bindDependencies();
    }

    static getInstance(): DIContainer {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer();
        }
        return DIContainer.instance;
    }

    private bindDependencies(): void {
        // ============================================================
        // Infrastructure Services
        // ============================================================

        // Prisma Service - Singleton
        this.container.bind(TYPES.PrismaService).toConstantValue(PrismaService.getInstance());

        // Cache Service - Singleton
        this.container.bind<RedisCache>(TYPES.CacheService).to(RedisCache).inSingletonScope();

        // Password Hasher - Singleton
        this.container.bind<BcryptPasswordHasher>(TYPES.PasswordHasher).to(BcryptPasswordHasher).inSingletonScope();

        // Token Generator - Singleton
        this.container.bind<JwtTokenGenerator>(TYPES.TokenGenerator).to(JwtTokenGenerator).inSingletonScope();

        // ============================================================
        // Repository Implementations (Adapters)
        // ============================================================

        this.container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
        this.container.bind<TokenRepository>(TYPES.TokenRepository).to(TokenRepository).inSingletonScope();
        this.container.bind<TwoFactorRepository>(TYPES.TwoFactorRepository).to(TwoFactorRepository).inSingletonScope();
        this.container.bind<UserVerifyRepository>(TYPES.UserVerifyRepository).to(UserVerifyRepository).inSingletonScope();
        this.container.bind<OAuthAccountRepository>(TYPES.OAuthAccountRepository).to(OAuthAccountRepository).inSingletonScope();
        this.container.bind<PasswordHistoryRepository>(TYPES.PasswordHistoryRepository).to(PasswordHistoryRepository).inSingletonScope();
        this.container.bind<AuditLogRepository>(TYPES.AuditLogRepository).to(AuditLogRepository).inSingletonScope();
        this.container.bind<LoginAttemptRepository>(TYPES.LoginAttemptRepository).to(LoginAttemptRepository).inSingletonScope();
        this.container.bind<ApiKeyRepository>(TYPES.ApiKeyRepository).to(ApiKeyRepository).inSingletonScope();
        this.container.bind<IpBlockRepository>(TYPES.IpBlockRepository).to(IpBlockRepository).inSingletonScope();

        // ============================================================
        // Use Cases (Application Services)
        // ============================================================

        this.container.bind<AuthUseCase>(TYPES.AuthUseCase).to(AuthUseCase).inSingletonScope();
        this.container.bind<TokenUseCase>(TYPES.TokenUseCase).to(TokenUseCase).inSingletonScope();
        this.container.bind<PasswordUseCase>(TYPES.PasswordUseCase).to(PasswordUseCase).inSingletonScope();
        this.container.bind<TwoFactorUseCase>(TYPES.TwoFactorUseCase).to(TwoFactorUseCase).inSingletonScope();
        this.container.bind<VerifyUseCase>(TYPES.VerifyUseCase).to(VerifyUseCase).inSingletonScope();
        this.container.bind<OAuthUseCase>(TYPES.OAuthUseCase).to(OAuthUseCase).inSingletonScope();
        this.container.bind<SessionUseCase>(TYPES.SessionUseCase).to(SessionUseCase).inSingletonScope();
        this.container.bind<ApiKeyUseCase>(TYPES.ApiKeyUseCase).to(ApiKeyUseCase).inSingletonScope();
        this.container.bind<InternalUseCase>(TYPES.InternalUseCase).to(InternalUseCase).inSingletonScope();
    }

    // ============================================================
    // Get Methods
    // ============================================================

    get<T>(service: symbol): T {
        return this.container.get<T>(service);
    }

    getContainer(): Container {
        return this.container;
    }

    // ============================================================
    // Convenience Methods for Common Services
    // ============================================================

    getAuthUseCase(): AuthUseCase {
        return this.get<AuthUseCase>(TYPES.AuthUseCase);
    }

    getTokenUseCase(): TokenUseCase {
        return this.get<TokenUseCase>(TYPES.TokenUseCase);
    }

    getPasswordUseCase(): PasswordUseCase {
        return this.get<PasswordUseCase>(TYPES.PasswordUseCase);
    }

    getSessionUseCase(): SessionUseCase {
        return this.get<SessionUseCase>(TYPES.SessionUseCase);
    }

    getTwoFactorUseCase(): TwoFactorUseCase {
        return this.get<TwoFactorUseCase>(TYPES.TwoFactorUseCase);
    }

    getVerifyUseCase(): VerifyUseCase {
        return this.get<VerifyUseCase>(TYPES.VerifyUseCase);
    }

    getOAuthUseCase(): OAuthUseCase {
        return this.get<OAuthUseCase>(TYPES.OAuthUseCase);
    }

    getApiKeyUseCase(): ApiKeyUseCase {
        return this.get<ApiKeyUseCase>(TYPES.ApiKeyUseCase);
    }

    getInternalUseCase(): InternalUseCase {
        return this.get<InternalUseCase>(TYPES.InternalUseCase);
    }

    // ============================================================
    // Infrastructure Services
    // ============================================================

    getPrismaService(): PrismaService {
        return this.get<PrismaService>(TYPES.PrismaService);
    }

    getCacheService(): RedisCache {
        return this.get<RedisCache>(TYPES.CacheService);
    }

    getPasswordHasher(): BcryptPasswordHasher {
        return this.get<BcryptPasswordHasher>(TYPES.PasswordHasher);
    }

    getTokenGenerator(): JwtTokenGenerator {
        return this.get<JwtTokenGenerator>(TYPES.TokenGenerator);
    }

    // ============================================================
    // Repositories
    // ============================================================

    getUserRepository(): UserRepository {
        return this.get<UserRepository>(TYPES.UserRepository);
    }

    getTokenRepository(): TokenRepository {
        return this.get<TokenRepository>(TYPES.TokenRepository);
    }

    getTwoFactorRepository(): TwoFactorRepository {
        return this.get<TwoFactorRepository>(TYPES.TwoFactorRepository);
    }

    // ============================================================
    // Reset / Cleanup
    // ============================================================

    async cleanup(): Promise<void> {
        const cache = this.getCacheService();
        await cache.close();

        const prisma = this.getPrismaService();
        await prisma.disconnect();
    }
}

// ============================================================
// Export singleton instance
// ============================================================

export const diContainer = DIContainer.getInstance();

// Export types for use in other modules
export { TYPES };
