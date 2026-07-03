/**
 * DI Type Definitions
 * Defines all types for dependency injection using InversifyJS
 */

// ============================================================
// Infrastructure Types
// ============================================================

export const INFRASTRUCTURE_TYPES = {
    // Database
    PrismaService: Symbol.for('PrismaService'),

    // Cache
    CacheService: Symbol.for('CacheService'),

    // Security
    PasswordHasher: Symbol.for('PasswordHasher'),
    TokenGenerator: Symbol.for('TokenGenerator'),

    // Messaging
    NotificationService: Symbol.for('NotificationService'),
    KafkaProducer: Symbol.for('KafkaProducer'),
};

// ============================================================
// Domain Repository Types (Ports)
// ============================================================

export const REPOSITORY_TYPES = {
    // Core Repositories
    UserRepository: Symbol.for('UserRepository'),
    TokenRepository: Symbol.for('TokenRepository'),
    TwoFactorRepository: Symbol.for('TwoFactorRepository'),
    UserVerifyRepository: Symbol.for('UserVerifyRepository'),
    OAuthAccountRepository: Symbol.for('OAuthAccountRepository'),
    PasswordHistoryRepository: Symbol.for('PasswordHistoryRepository'),
    AuditLogRepository: Symbol.for('AuditLogRepository'),
    LoginAttemptRepository: Symbol.for('LoginAttemptRepository'),
    ApiKeyRepository: Symbol.for('ApiKeyRepository'),
    IpBlockRepository: Symbol.for('IpBlockRepository'),
};

// ============================================================
// Application Use Case Types
// ============================================================

export const USE_CASE_TYPES = {
    // Auth
    AuthUseCase: Symbol.for('AuthUseCase'),

    // Token
    TokenUseCase: Symbol.for('TokenUseCase'),

    // Password
    PasswordUseCase: Symbol.for('PasswordUseCase'),

    // Two Factor
    TwoFactorUseCase: Symbol.for('TwoFactorUseCase'),

    // Verify
    VerifyUseCase: Symbol.for('VerifyUseCase'),

    // OAuth
    OAuthUseCase: Symbol.for('OAuthUseCase'),

    // Session
    SessionUseCase: Symbol.for('SessionUseCase'),

    // API Key
    ApiKeyUseCase: Symbol.for('ApiKeyUseCase'),

    // Internal
    InternalUseCase: Symbol.for('InternalUseCase'),
};

// ============================================================
// Shared Types
// ============================================================

export const SHARED_TYPES = {
    Logger: Symbol.for('Logger'),
    Validator: Symbol.for('Validator'),
    ErrorHandler: Symbol.for('ErrorHandler'),
};

// ============================================================
// Export all types as a single object
// ============================================================

export const TYPES = {
    ...INFRASTRUCTURE_TYPES,
    ...REPOSITORY_TYPES,
    ...USE_CASE_TYPES,
    ...SHARED_TYPES,
};
