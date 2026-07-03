# 📘 Clean Architecture - Hướng Dẫn Chi Tiết

## Table of Contents

- [1. Tổng Quan](#1-tổng-quan)
- [2. Cấu Trúc Thư Mục Chuẩn](#2-cấu-trúc-thư-mục-chuẩn)
- [3. Layer By Layer - Chi Tiết & Ví Dụ](#3-layer-by-layer---chi-tiết--ví-dụ)
    - [Layer 1: Domain Entity](#layer-1-domain-entity-innermost)
    - [Layer 2: Repository Interfaces (Ports)](#layer-2-repository-interfaces-ports)
    - [Layer 3: Use Cases (Application Business Rules)](#layer-3-use-cases-application-business-rules)
    - [Layer 4: Infrastructure Implementations](#layer-4-infrastructure-implementations)
    - [Layer 5: Presentation (Controllers)](#layer-5-presentation-controllers)
    - [Layer 6: Dependency Injection Container](#layer-6-dependency-injection-container)
- [4. Entry Point - Bootstrap](#4-entry-point---bootstrap)
- [5. Key Principles Summary](#5-key-principles-summary)
- [6. Testing Strategy](#6-testing-strategy)
- [7. Migration Path](#7-migration-path)

---

## 1. Tổng Quan

### Phân Tích Kiến Trúc Hiện Tại

**Vấn đề hiện tại:**

1. **Không có rõ Domain Layer** - `src/types/` trộn lẫn Entity, DTO, Request/Response
2. **Repository chưa được định nghĩa** - `src/infra/repo/type.ts` rỗng
3. **UseCase chỉ là interface** - Chưa có implementation, không có business logic
4. **Không có Ports & Adapters** - Thiếu interface để đảo ngược dependency
5. **Direct dependency với Prisma** - Domain knowledge leak ra outer layers

### Dependency Rule (Quy tắc Dependency)

```
┌─────────────────────────────────────────────────────────┐
│                    Frameworks & Drivers                 │
│  (Express, Prisma, Redis, Kafka, SMTP...)              │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ depends on
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Interface Adapters                     │
│  Controllers, Presenters, Repositories (Impl)           │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ depends on
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      Use Cases                          │
│  Application Business Rules (Orchestration)            │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ depends on
                          ▼
┌─────────────────────────────────────────────────────────┐
│                       Entities                          │
│  Core Business Rules (Domain)                          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Cấu Trúc Thư Mục Chuẩn

```
src/
├── domain/                    # INNERMOST LAYER - No dependencies outward
│   ├── entity/               # Core business entities
│   │   ├── user.entity.ts
│   │   ├── token.entity.ts
│   │   ├── twoFactor.entity.ts
│   │   └── index.ts
│   ├── value-object/         # Immutable values (Email, Password, Token)
│   │   ├── email.vo.ts
│   │   ├── password.vo.ts
│   │   └── index.ts
│   ├── domain-error/         # Domain-specific errors
│   │   ├── errors.ts
│   │   └── index.ts
│   ├── repository-interface/ # Ports (contracts for outer layers)
│   │   ├── user.repository.interface.ts
│   │   ├── token.repository.interface.ts
│   │   ├── cache.port.interface.ts
│   │   ├── notification.port.interface.ts
│   │   └── index.ts
│   └── service-interface/   # Domain services contracts
│       ├── password-hasher.interface.ts
│       ├── token-generator.interface.ts
│       └── index.ts
│
├── application/              # USE CASES LAYER
│   ├── dto/                  # Data Transfer Objects (Input/Output)
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   └── index.ts
│   ├── use-case/             # Application business rules
│   │   ├── auth/
│   │   │   ├── register.use-case.ts
│   │   │   ├── login.use-case.ts
│   │   │   ├── logout.use-case.ts
│   │   │   └── index.ts
│   │   ├── token/
│   │   │   ├── refresh.use-case.ts
│   │   │   ├── revoke.use-case.ts
│   │   │   └── index.ts
│   │   ├── 2fa/
│   │   │   └── ...
│   │   └── index.ts
│   ├── error/                # Application errors
│   │   └── errors.ts
│   └── interface/            # Use case interfaces (for DI)
│       └── auth.use-case.interface.ts
│
├── infrastructure/           # OUTER LAYERS
│   ├── persistence/          # Database implementations
│   │   ├── prisma/
│   │   │   ├── prisma.ts
│   │   │   └── migrations.ts
│   │   └── repository/       # Repository implementations
│   │       ├── user.repository.impl.ts
│   │       ├── token.repository.impl.ts
│   │       └── index.ts
│   ├── cache/               # Cache implementations
│   │   ├── redis.cache.impl.ts
│   │   └── index.ts
│   ├── security/            # Security implementations
│   │   ├── bcrypt.password-hasher.impl.ts
│   │   ├── jwt.token-generator.impl.ts
│   │   └── index.ts
│   ├── notification/        # External service implementations
│   │   ├── smtp.notification.impl.ts
│   │   └── index.ts
│   └── messaging/           # Message queue implementations
│       └── kafka.producer.impl.ts
│
├── presentation/             # CONTROLLERS/PRESENTERS
│   ├── http/                # HTTP controllers
│   │   ├── auth.controller.ts
│   │   ├── token.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── error-handler.middleware.ts
│   │   └── index.ts
│   ├── grpc/                # gRPC controllers (optional)
│   └── response-formatter/  # Response transformers
│       └── index.ts
│
├── shared/                   # Shared utilities (cross-cutting)
│   ├── logger/
│   │   └── logger.ts
│   ├── validator/
│   │   └── validator.ts
│   └── constants/
│       └── index.ts
│
├── config/                   # Configuration
│   └── index.ts
│
├── di/                       # Dependency Injection Container
│   ├── container.ts
│   └── types.ts
│
└── index.ts                  # Application entry point
```

---

## 3. Layer By Layer - Chi Tiết & Ví Dụ

### Layer 1: Domain Entity (Innermost)

**Nguyên tắc:** Không dependency bất kỳ thư viện bên ngoài. Chỉ chứa business rules thuần túy.

```typescript
// src/domain/entity/user.entity.ts

import { Result } from '../value-object/result.vo';
import { UserError } from '../domain-error/errors';

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    STAFF = 'STAFF',
    INVESTOR = 'INVESTOR',
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    BANNED = 'BANNED',
    DELETED = 'DELETED',
    UNVERIFIED = 'UNVERIFIED',
}

/**
 * User Entity - Core business rules
 * Plain TypeScript class - NO framework dependencies
 */
export class User {
    private readonly _id: string;
    private _username: string;
    private _email: string | null;
    private _phone: string | null;
    private _passwordHash: string;
    private _role: UserRole;
    private _status: UserStatus;
    private _failedLoginCount: number;
    private _lockedUntil: Date | null;
    private _lastLoginAt: Date | null;
    private _lastLoginIp: string | null;
    private _passwordChangedAt: Date | null;
    private readonly _createdAt: Date;
    private _updatedAt: Date;
    private _deletedAt: Date | null;

    private constructor(props: UserProps) {
        this._id = props.id;
        this._username = props.username;
        this._email = props.email;
        this._phone = props.phone;
        this._passwordHash = props.passwordHash;
        this._role = props.role;
        this._status = props.status;
        this._failedLoginCount = props.failedLoginCount ?? 0;
        this._lockedUntil = props.lockedUntil ?? null;
        this._lastLoginAt = props.lastLoginAt ?? null;
        this._lastLoginIp = props.lastLoginIp ?? null;
        this._passwordChangedAt = props.passwordChangedAt ?? null;
        this._createdAt = props.createdAt;
        this._updatedAt = props.updatedAt;
        this._deletedAt = props.deletedAt ?? null;
    }

    // ===== Factory Methods =====

    static create(props: CreateUserProps): Result<User> {
        // Validation rules
        if (!User.isValidUsername(props.username)) {
            return Result.fail(UserError.INVALID_USERNAME);
        }

        if (props.email && !User.isValidEmail(props.email)) {
            return Result.fail(UserError.INVALID_EMAIL);
        }

        if (props.phone && !User.isValidPhone(props.phone)) {
            return Result.fail(UserError.INVALID_PHONE);
        }

        const user = new User({
            id: props.id ?? crypto.randomUUID(),
            username: props.username,
            email: props.email ?? null,
            phone: props.phone ?? null,
            passwordHash: props.passwordHash,
            role: props.role ?? UserRole.USER,
            status: UserStatus.UNVERIFIED,
            failedLoginCount: 0,
            lockedUntil: null,
            lastLoginAt: null,
            lastLoginIp: null,
            passwordChangedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        });

        return Result.ok(user);
    }

    static fromPersistence(props: UserProps): User {
        return new User(props);
    }

    // ===== Business Logic =====

    /**
     * Verify password - Domain rule for authentication
     */
    verifyPassword(plainPassword: string, hasher: PasswordHasher): boolean {
        return hasher.verify(plainPassword, this._passwordHash);
    }

    /**
     * Record failed login attempt - Domain rule for security
     */
    recordFailedLogin(): void {
        this._failedLoginCount += 1;

        // Auto-lock after 5 failed attempts
        if (this._failedLoginCount >= 5) {
            this._lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }

        this._updatedAt = new Date();
    }

    /**
     * Record successful login
     */
    recordSuccessfulLogin(ip: string): void {
        this._failedLoginCount = 0;
        this._lockedUntil = null;
        this._lastLoginAt = new Date();
        this._lastLoginIp = ip;
        this._updatedAt = new Date();
    }

    /**
     * Change password - Domain rule for password rotation
     */
    changePassword(newHash: string, oldPasswords: string[]): Result<void> {
        // Check password not recently used
        if (oldPasswords.includes(newHash)) {
            return Result.fail(UserError.PASSWORD_RECENTLY_USED);
        }

        this._passwordHash = newHash;
        this._passwordChangedAt = new Date();
        this._updatedAt = new Date();

        return Result.ok(undefined);
    }

    /**
     * Ban user - Domain rule
     */
    ban(): void {
        this._status = UserStatus.BANNED;
        this._updatedAt = new Date();
    }

    /**
     * Unban user
     */
    unban(): void {
        this._status = UserStatus.ACTIVE;
        this._failedLoginCount = 0;
        this._lockedUntil = null;
        this._updatedAt = new Date();
    }

    /**
     * Check if user can login
     */
    canLogin(): Result<void> {
        if (this._status === UserStatus.BANNED) {
            return Result.fail(UserError.ACCOUNT_BANNED);
        }

        if (this._status === UserStatus.DELETED) {
            return Result.fail(UserError.ACCOUNT_DELETED);
        }

        if (this._status === UserStatus.UNVERIFIED) {
            return Result.fail(UserError.ACCOUNT_UNVERIFIED);
        }

        if (this._lockedUntil && this._lockedUntil > new Date()) {
            return Result.fail(UserError.ACCOUNT_LOCKED);
        }

        return Result.ok(undefined);
    }

    /**
     * Mark account as verified
     */
    markAsVerified(): void {
        this._status = UserStatus.ACTIVE;
        this._updatedAt = new Date();
    }

    /**
     * Soft delete
     */
    softDelete(): void {
        this._status = UserStatus.DELETED;
        this._deletedAt = new Date();
        this._updatedAt = new Date();
    }

    // ===== Getters (Read-only) =====

    get id(): string {
        return this._id;
    }
    get username(): string {
        return this._username;
    }
    get email(): string | null {
        return this._email;
    }
    get phone(): string | null {
        return this._phone;
    }
    get role(): UserRole {
        return this._role;
    }
    get status(): UserStatus {
        return this._status;
    }
    get failedLoginCount(): number {
        return this._failedLoginCount;
    }
    get lockedUntil(): Date | null {
        return this._lockedUntil;
    }
    get lastLoginAt(): Date | null {
        return this._lastLoginAt;
    }
    get lastLoginIp(): string | null {
        return this._lastLoginIp;
    }
    get passwordChangedAt(): Date | null {
        return this._passwordChangedAt;
    }
    get createdAt(): Date {
        return this._createdAt;
    }
    get updatedAt(): Date {
        return this._updatedAt;
    }
    get deletedAt(): Date | null {
        return this._deletedAt;
    }

    // ===== Private Validators =====

    private static isValidUsername(username: string): boolean {
        // Username: 3-50 chars, alphanumeric + underscore
        return /^[a-zA-Z0-9_]{3,50}$/.test(username);
    }

    private static isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    private static isValidPhone(phone: string): boolean {
        // Phone: 10-15 digits, optional + prefix
        return /^\+?[1-9]\d{9,14}$/.test(phone);
    }

    /**
     * Convert to persistence format
     */
    toPersistence(): UserProps {
        return {
            id: this._id,
            username: this._username,
            email: this._email,
            phone: this._phone,
            passwordHash: this._passwordHash,
            role: this._role,
            status: this._status,
            failedLoginCount: this._failedLoginCount,
            lockedUntil: this._lockedUntil,
            lastLoginAt: this._lastLoginAt,
            lastLoginIp: this._lastLoginIp,
            passwordChangedAt: this._passwordChangedAt,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
            deletedAt: this._deletedAt,
        };
    }
}

// ===== Types =====

export interface UserProps {
    id: string;
    username: string;
    email: string | null;
    phone: string | null;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    failedLoginCount: number;
    lockedUntil: Date | null;
    lastLoginAt: Date | null;
    lastLoginIp: string | null;
    passwordChangedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export interface CreateUserProps {
    id?: string;
    username: string;
    email?: string;
    phone?: string;
    passwordHash: string;
    role?: UserRole;
}

// ===== Dependencies (Interface) =====

export interface PasswordHasher {
    verify(plain: string, hash: string): boolean;
}
```

```typescript
// src/domain/value-object/result.vo.ts

/**
 * Result Value Object - For handling operations that can fail
 * Alternative to exceptions for control flow
 */
export class Result<T = void> {
    private readonly _isSuccess: boolean;
    private readonly _error?: Error;
    private readonly _value?: T;

    private constructor(isSuccess: boolean, value?: T, error?: Error) {
        this._isSuccess = isSuccess;
        this._value = value;
        this._error = error;
    }

    static ok<U>(value: U): Result<U> {
        return new Result<U>(true, value);
    }

    static fail<U>(error: Error): Result<U> {
        return new Result<U>(false, undefined, error);
    }

    get isSuccess(): boolean {
        return this._isSuccess;
    }
    get isFailure(): boolean {
        return !this._isSuccess;
    }

    get value(): T {
        if (!this._isSuccess) throw new Error('Cannot get value from failed result');
        return this._value as T;
    }

    get error(): Error {
        if (this._isSuccess) throw new Error('Cannot get error from successful result');
        return this._error as Error;
    }

    map<U>(fn: (value: T) => U): Result<U> {
        if (!this._isSuccess) return Result.fail(this._error!);
        try {
            return Result.ok(fn(this._value!));
        } catch (e) {
            return Result.fail(e as Error);
        }
    }

    flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
        if (!this._isSuccess) return Result.fail(this._error!);
        return fn(this._value!);
    }
}
```

```typescript
// src/domain/domain-error/errors.ts

/**
 * Domain Errors - Business rule violations
 * These are NOT HTTP errors - they will be mapped in outer layers
 */
export class UserError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = 'UserError';
    }

    static INVALID_USERNAME = new UserError(
        'INVALID_USERNAME',
        'Username must be 3-50 alphanumeric characters',
    );
    static INVALID_EMAIL = new UserError('INVALID_EMAIL', 'Invalid email format');
    static INVALID_PHONE = new UserError('INVALID_PHONE', 'Invalid phone number format');
    static ACCOUNT_BANNED = new UserError('ACCOUNT_BANNED', 'Account has been banned', 403);
    static ACCOUNT_DELETED = new UserError('ACCOUNT_DELETED', 'Account has been deleted', 410);
    static ACCOUNT_UNVERIFIED = new UserError('ACCOUNT_UNVERIFIED', 'Account is not verified', 403);
    static ACCOUNT_LOCKED = new UserError('ACCOUNT_LOCKED', 'Account is temporarily locked', 423);
    static PASSWORD_RECENTLY_USED = new UserError(
        'PASSWORD_RECENTLY_USED',
        'Password was recently used',
    );
}
```

---

### Layer 2: Repository Interfaces (Ports)

**Nguyên tắc:** Định nghĩa tại Domain layer, implement tại Infrastructure layer.

```typescript
// src/domain/repository-interface/user.repository.interface.ts

import { User, UserProps, CreateUserProps } from '../entity/user.entity';
import { Result } from '../value-object/result.vo';

/**
 * User Repository Interface (PORT)
 * Defined in Domain, implemented in Infrastructure
 * This is the Dependency Inversion Principle in action
 */
export interface IUserRepository {
    // CRUD operations
    save(user: User): Promise<Result<void>>;
    findById(id: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByPhone(phone: string): Promise<User | null>;

    // Query operations
    findMany(filter: UserFilter): Promise<User[]>;
    count(filter: UserFilter): Promise<number>;

    // Delete operations
    softDelete(id: string): Promise<Result<void>>;
    permanentlyDelete(id: string): Promise<Result<void>>;
}

// ===== Types =====

export interface UserFilter {
    status?: User['status'];
    role?: User['role'];
    search?: string; // Search in email, username, phone
    limit?: number;
    offset?: number;
}

/**
 * Token Repository Interface
 */
export interface ITokenRepository {
    save(token: Token): Promise<Result<void>>;
    findById(id: string): Promise<Token | null>;
    findByRefreshToken(hash: string): Promise<Token | null>;
    findByUserId(userId: string): Promise<Token[]>;
    revoke(id: string): Promise<Result<void>>;
    revokeAllByUserId(userId: string): Promise<Result<void>>;
}

/**
 * Cache Port Interface
 */
export interface ICachePort {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    deletePattern(pattern: string): Promise<void>;
}

/**
 * Notification Port Interface
 */
export interface INotificationPort {
    sendEmail(params: EmailParams): Promise<Result<void>>;
    sendSms(params: SmsParams): Promise<Result<void>>;
}

export interface EmailParams {
    to: string;
    subject: string;
    template: string;
    data: Record<string, unknown>;
}

export interface SmsParams {
    to: string;
    message: string;
}
```

---

### Layer 3: Use Cases (Application Business Rules)

**Nguyên tắc:** Orchestrate entities, use repository interfaces, contain application-specific logic.

```typescript
// src/application/use-case/auth/register.use-case.ts

import { Result } from '../../../domain/value-object/result.vo';
import { User, UserError } from '../../../domain/entity/user.entity';
import {
    IUserRepository,
    INotificationPort,
    ICachePort,
} from '../../../domain/repository-interface';
import { RegisterDTO, RegisterResponseDTO } from '../../dto';
import { PasswordHasher } from '../../../domain/service-interface/password-hasher.interface';
import { TokenGenerator } from '../../../domain/service-interface/token-generator.interface';

/**
 * Register Use Case
 *
 * Responsibilities:
 * 1. Validate input
 * 2. Check for duplicates
 * 3. Hash password
 * 4. Create user entity
 * 5. Persist user
 * 6. Send verification email
 * 7. Return response
 */
export class RegisterUseCase {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly notification: INotificationPort,
        private readonly cache: ICachePort,
        private readonly passwordHasher: PasswordHasher,
        private readonly tokenGenerator: TokenGenerator,
    ) {}

    async execute(dto: RegisterDTO): Promise<Result<RegisterResponseDTO>> {
        // 1. Validate input
        const validationResult = this.validateInput(dto);
        if (validationResult.isFailure) {
            return Result.fail(validationResult.error);
        }

        // 2. Check duplicates
        const existingUser = await this.checkDuplicates(dto);
        if (existingUser) {
            return Result.fail(this.getDuplicateError(existingUser, dto));
        }

        // 3. Hash password
        const passwordHash = await this.passwordHasher.hash(dto.password);

        // 4. Create user entity
        const userResult = User.create({
            username: dto.username,
            email: dto.email,
            phone: dto.phone,
            passwordHash,
        });

        if (userResult.isFailure) {
            return Result.fail(userResult.error);
        }

        const user = userResult.value;

        // 5. Persist user
        await this.userRepo.save(user);

        // 6. Create verification token
        const verificationToken = await this.tokenGenerator.generateVerificationToken();
        await this.cache.set(
            `email_verify:${verificationToken}`,
            user.id,
            24 * 60 * 60, // 24 hours
        );

        // 7. Send verification email
        await this.notification.sendEmail({
            to: dto.email,
            subject: 'Verify your email',
            template: 'email-verify',
            data: {
                username: user.username,
                verifyUrl: `${process.env.APP_URL}/verify?token=${verificationToken}`,
            },
        });

        // 8. Return response
        return Result.ok({
            userId: user.id,
            message: 'Registration successful. Please check your email to verify.',
        });
    }

    private validateInput(dto: RegisterDTO): Result<void> {
        // Password strength validation
        if (dto.password.length < 8) {
            return Result.fail(new Error('Password must be at least 8 characters'));
        }

        if (!/[A-Z]/.test(dto.password)) {
            return Result.fail(new Error('Password must contain at least one uppercase letter'));
        }

        if (!/[a-z]/.test(dto.password)) {
            return Result.fail(new Error('Password must contain at least one lowercase letter'));
        }

        if (!/[0-9]/.test(dto.password)) {
            return Result.fail(new Error('Password must contain at least one digit'));
        }

        return Result.ok(undefined);
    }

    private async checkDuplicates(dto: RegisterDTO): Promise<User | null> {
        // Check username
        const byUsername = await this.userRepo.findByUsername(dto.username);
        if (byUsername) return byUsername;

        // Check email
        if (dto.email) {
            const byEmail = await this.userRepo.findByEmail(dto.email);
            if (byEmail) return byEmail;
        }

        // Check phone
        if (dto.phone) {
            const byPhone = await this.userRepo.findByPhone(dto.phone);
            if (byPhone) return byPhone;
        }

        return null;
    }

    private getDuplicateError(user: User, dto: RegisterDTO): Error {
        if (user.username === dto.username) {
            return new Error('Username already exists');
        }
        if (user.email === dto.email) {
            return new Error('Email already exists');
        }
        if (user.phone === dto.phone) {
            return new Error('Phone number already exists');
        }
        return new Error('User already exists');
    }
}
```

```typescript
// src/application/use-case/auth/login.use-case.ts

import { Result } from '../../../domain/value-object/result.vo';
import { User } from '../../../domain/entity/user.entity';
import {
    IUserRepository,
    ITokenRepository,
    ICachePort,
} from '../../../domain/repository-interface';
import { LoginDTO, LoginResponseDTO } from '../../dto';
import { PasswordHasher } from '../../../domain/service-interface/password-hasher.interface';
import {
    TokenGenerator,
    TokenPair,
} from '../../../domain/service-interface/token-generator.interface';

/**
 * Login Use Case
 *
 * Flow:
 * 1. Find user by identifier
 * 2. Verify password
 * 3. Check if user can login (status, lock, etc.)
 * 4. Record login attempt
 * 5. Generate tokens
 * 6. Save token
 * 7. Return response
 */
export class LoginUseCase {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly tokenRepo: ITokenRepository,
        private readonly cache: ICachePort,
        private readonly passwordHasher: PasswordHasher,
        private readonly tokenGenerator: TokenGenerator,
    ) {}

    async execute(dto: LoginDTO, context: RequestContext): Promise<Result<LoginResponseDTO>> {
        // 1. Find user
        const user = await this.findUser(dto.identifier);
        if (!user) {
            return Result.fail(new Error('Invalid credentials'));
        }

        // 2. Verify password
        const isValid = user.verifyPassword(dto.password, this.passwordHasher);
        if (!isValid) {
            user.recordFailedLogin();
            await this.userRepo.save(user);
            return Result.fail(new Error('Invalid credentials'));
        }

        // 3. Check if user can login
        const canLoginResult = user.canLogin();
        if (canLoginResult.isFailure) {
            return Result.fail(canLoginResult.error);
        }

        // 4. Record successful login
        user.recordSuccessfulLogin(context.ipAddress);
        await this.userRepo.save(user);

        // 5. Check 2FA
        if (user.twoFactorEnabled) {
            // Return 2FA challenge
            const sessionToken = await this.tokenGenerator.generateSessionToken(user.id);
            return Result.ok({
                twoFactorRequired: true,
                sessionToken,
                method: user.twoFactorMethod,
            });
        }

        // 6. Generate tokens
        const tokens = await this.tokenGenerator.generateTokenPair(user);

        // 7. Save token
        await this.tokenRepo.save({
            userId: user.id,
            accessJti: tokens.accessJti,
            refreshTokenHash: await this.passwordHasher.hash(tokens.refreshToken),
            deviceId: dto.deviceId,
            deviceName: dto.deviceName,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            expiresAt: tokens.refreshExpiresAt,
        });

        // 8. Cache user data for fast lookup
        await this.cache.set(`user:${user.id}`, user.toPersistence(), 3600);

        // 9. Return response
        return Result.ok({
            tokens,
            user: this.toUserDTO(user),
        });
    }

    private async findUser(identifier: string): Promise<User | null> {
        // Try email first
        const byEmail = await this.userRepo.findByEmail(identifier);
        if (byEmail) return byEmail;

        // Try username
        const byUsername = await this.userRepo.findByUsername(identifier);
        if (byUsername) return byUsername;

        // Try phone
        const byPhone = await this.userRepo.findByPhone(identifier);
        if (byPhone) return byPhone;

        return null;
    }

    private toUserDTO(user: User): UserDTO {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            twoFactorEnabled: user.twoFactorEnabled,
        };
    }
}

interface RequestContext {
    ipAddress: string;
    userAgent: string | null;
}

interface UserDTO {
    id: string;
    username: string;
    email: string | null;
    role: string;
    status: string;
    twoFactorEnabled: boolean;
}
```

---

### Layer 4: Infrastructure Implementations

**Nguyên tắc:** Implement interfaces defined in Domain layer. Framework-specific code lives here.

```typescript
// src/infrastructure/persistence/repository/user.repository.impl.ts

import {
    User,
    UserProps,
    CreateUserProps,
    UserRole,
    UserStatus,
} from '../../../../domain/entity/user.entity';
import {
    IUserRepository,
    UserFilter,
} from '../../../../domain/repository-interface/user.repository.interface';
import { Result } from '../../../../domain/value-object/result.vo';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../prisma/prisma';

/**
 * Prisma User Repository Implementation
 *
 * Maps between Domain Entities and Database Models
 * This is an ADAPTER that implements the PORT defined in Domain
 */
export class PrismaUserRepository implements IUserRepository {
    private readonly db: PrismaClient;

    constructor() {
        this.db = prisma;
    }

    async save(user: User): Promise<Result<void>> {
        try {
            const props = user.toPersistence();

            await this.db.user.upsert({
                where: { id: props.id },
                update: {
                    username: props.username,
                    email: props.email,
                    phone: props.phone,
                    passwordHash: props.passwordHash,
                    role: props.role,
                    status: props.status,
                    failedLoginCount: props.failedLoginCount,
                    lockedUntil: props.lockedUntil,
                    lastLoginAt: props.lastLoginAt,
                    lastLoginIp: props.lastLoginIp,
                    passwordChangedAt: props.passwordChangedAt,
                    updatedAt: props.updatedAt,
                    deletedAt: props.deletedAt,
                },
                create: {
                    id: props.id,
                    username: props.username,
                    email: props.email,
                    phone: props.phone,
                    passwordHash: props.passwordHash,
                    role: props.role,
                    status: props.status,
                    failedLoginCount: props.failedLoginCount,
                    lockedUntil: props.lockedUntil,
                    lastLoginAt: props.lastLoginAt,
                    lastLoginIp: props.lastLoginIp,
                    passwordChangedAt: props.passwordChangedAt,
                    createdAt: props.createdAt,
                    updatedAt: props.updatedAt,
                    deletedAt: props.deletedAt,
                },
            });

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(error as Error);
        }
    }

    async findById(id: string): Promise<User | null> {
        const record = await this.db.user.findUnique({
            where: { id },
        });

        if (!record) return null;

        return this.mapToEntity(record);
    }

    async findByUsername(username: string): Promise<User | null> {
        const record = await this.db.user.findUnique({
            where: { username },
        });

        if (!record) return null;

        return this.mapToEntity(record);
    }

    async findByEmail(email: string): Promise<User | null> {
        const record = await this.db.user.findUnique({
            where: { email },
        });

        if (!record) return null;

        return this.mapToEntity(record);
    }

    async findByPhone(phone: string): Promise<User | null> {
        const record = await this.db.user.findUnique({
            where: { phone },
        });

        if (!record) return null;

        return this.mapToEntity(record);
    }

    async findMany(filter: UserFilter): Promise<User[]> {
        const records = await this.db.user.findMany({
            where: this.buildWhereClause(filter),
            take: filter.limit,
            skip: filter.offset,
            orderBy: { createdAt: 'desc' },
        });

        return records.map((r) => this.mapToEntity(r));
    }

    async count(filter: UserFilter): Promise<number> {
        return this.db.user.count({
            where: this.buildWhereClause(filter),
        });
    }

    async softDelete(id: string): Promise<Result<void>> {
        try {
            await this.db.user.update({
                where: { id },
                data: {
                    status: UserStatus.DELETED,
                    deletedAt: new Date(),
                },
            });

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(error as Error);
        }
    }

    async permanentlyDelete(id: string): Promise<Result<void>> {
        try {
            await this.db.user.delete({
                where: { id },
            });

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(error as Error);
        }
    }

    // ===== Private Methods =====

    private mapToEntity(record: any): User {
        return User.fromPersistence({
            id: record.id,
            username: record.username,
            email: record.email,
            phone: record.phone,
            passwordHash: record.passwordHash,
            role: record.role as UserRole,
            status: record.status as UserStatus,
            failedLoginCount: record.failedLoginCount,
            lockedUntil: record.lockedUntil,
            lastLoginAt: record.lastLoginAt,
            lastLoginIp: record.lastLoginIp,
            passwordChangedAt: record.passwordChangedAt,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            deletedAt: record.deletedAt,
        });
    }

    private buildWhereClause(filter: UserFilter) {
        const where: any = {};

        if (filter.status) {
            where.status = filter.status;
        }

        if (filter.role) {
            where.role = filter.role;
        }

        if (filter.search) {
            where.OR = [
                { email: { contains: filter.search, mode: 'insensitive' } },
                { username: { contains: filter.search, mode: 'insensitive' } },
                { phone: { contains: filter.search } },
            ];
        }

        return where;
    }
}
```

```typescript
// src/infrastructure/security/bcrypt.password-hasher.impl.ts

import { PasswordHasher } from '../../../domain/service-interface/password-hasher.interface';
import * as bcrypt from 'bcrypt';

/**
 * Bcrypt Password Hasher Implementation
 */
export class BcryptPasswordHasher implements PasswordHasher {
    private readonly SALT_ROUNDS = 12;

    async hash(plain: string): Promise<string> {
        return bcrypt.hash(plain, this.SALT_ROUNDS);
    }

    verify(plain: string, hash: string): boolean {
        return bcrypt.compareSync(plain, hash);
    }
}
```

```typescript
// src/infrastructure/cache/redis.cache.impl.ts

import { ICachePort } from '../../../domain/repository-interface/cache.port.interface';
import { Redis } from 'ioredis';

/**
 * Redis Cache Implementation
 */
export class RedisCache implements ICachePort {
    private readonly client: Redis;

    constructor(uri: string) {
        this.client = new Redis(uri);
    }

    async get<T>(key: string): Promise<T | null> {
        const value = await this.client.get(key);
        if (!value) return null;
        return JSON.parse(value) as T;
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        const serialized = JSON.stringify(value);
        if (ttl) {
            await this.client.setex(key, ttl, serialized);
        } else {
            await this.client.set(key, serialized);
        }
    }

    async delete(key: string): Promise<void> {
        await this.client.del(key);
    }

    async deletePattern(pattern: string): Promise<void> {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
            await this.client.del(...keys);
        }
    }
}
```

---

### Layer 5: Presentation (Controllers)

**Nguyên tắc:** Thin layer - validate HTTP request, call use case, format HTTP response.

```typescript
// src/presentation/http/auth.controller.ts

import { Request, Response, Router } from 'express';
import { RegisterUseCase } from '../../../application/use-case/auth/register.use-case';
import { LoginUseCase } from '../../../application/use-case/auth/login.use-case';
import { LogoutUseCase } from '../../../application/use-case/auth/logout.use-case';
import { RegisterDTO, LoginDTO, LogoutDTO } from '../../../application/dto';
import { HttpResponse } from '../response-formatter';
import { validateRequestBody } from '../../shared/validator';

/**
 * Auth HTTP Controller
 *
 * Responsibilities:
 * 1. Parse HTTP request
 * 2. Validate DTO
 * 3. Call Use Case
 * 4. Format HTTP response
 * 5. Handle errors
 */
export class AuthController {
    constructor(
        private readonly registerUseCase: RegisterUseCase,
        private readonly loginUseCase: LoginUseCase,
        private readonly logoutUseCase: LogoutUseCase,
    ) {}

    get routes(): Router {
        const router = Router();

        router.post('/register', this.register.bind(this));
        router.post('/login', this.login.bind(this));
        router.post('/logout', this.logout.bind(this));

        return router;
    }

    /**
     * POST /auth/register
     */
    private async register(req: Request, res: Response): Promise<void> {
        try {
            // 1. Validate request body
            const dto = validateRequestBody(RegisterDTO, req.body);

            // 2. Execute use case
            const result = await this.registerUseCase.execute(dto);

            // 3. Format response
            if (result.isFailure) {
                HttpResponse.badRequest(res, result.error.message);
                return;
            }

            HttpResponse.created(res, result.value);
        } catch (error) {
            HttpResponse.internalError(res, 'An error occurred during registration');
        }
    }

    /**
     * POST /auth/login
     */
    private async login(req: Request, res: Response): Promise<void> {
        try {
            const dto = validateRequestBody(LoginDTO, req.body);
            const context = {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || null,
            };

            const result = await this.loginUseCase.execute(dto, context);

            if (result.isFailure) {
                HttpResponse.unauthorized(res, result.error.message);
                return;
            }

            HttpResponse.ok(res, result.value);
        } catch (error) {
            HttpResponse.internalError(res, 'An error occurred during login');
        }
    }

    /**
     * POST /auth/logout
     */
    private async logout(req: Request, res: Response): Promise<void> {
        try {
            const dto = validateRequestBody(LogoutDTO, req.body);
            const context = {
                ipAddress: req.ip,
                userId: res.locals.userId, // From JWT middleware
            };

            const result = await this.logoutUseCase.execute(dto, context);

            if (result.isFailure) {
                HttpResponse.badRequest(res, result.error.message);
                return;
            }

            HttpResponse.ok(res, { message: 'Logged out successfully' });
        } catch (error) {
            HttpResponse.internalError(res, 'An error occurred during logout');
        }
    }
}
```

```typescript
// src/presentation/response-formatter/index.ts

/**
 * HTTP Response Formatter
 * Standardizes API responses
 */
export class HttpResponse {
    static ok(res: Response, data: unknown): void {
        res.status(200).json({
            success: true,
            data,
        });
    }

    static created(res: Response, data: unknown): void {
        res.status(201).json({
            success: true,
            data,
        });
    }

    static badRequest(res: Response, message: string, details?: Record<string, string[]>): void {
        res.status(400).json({
            success: false,
            error: {
                code: 'BAD_REQUEST',
                message,
                details,
            },
        });
    }

    static unauthorized(res: Response, message: string = 'Unauthorized'): void {
        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message,
            },
        });
    }

    static forbidden(res: Response, message: string = 'Forbidden'): void {
        res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message,
            },
        });
    }

    static notFound(res: Response, message: string = 'Resource not found'): void {
        res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message,
            },
        });
    }

    static internalError(res: Response, message: string = 'Internal server error'): void {
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message,
            },
        });
    }
}
```

---

### Layer 6: Dependency Injection Container

**Nguyên tắc:** Wire everything together at the outermost layer.

```typescript
// src/di/container.ts

import { Container } from 'inversify';
import { TYPES } from './types';

// Domain Interfaces
import { IUserRepository, ICachePort, INotificationPort } from '../domain/repository-interface';
import { PasswordHasher, TokenGenerator } from '../domain/service-interface';

// Use Cases
import { RegisterUseCase } from '../application/use-case/auth/register.use-case';
import { LoginUseCase } from '../application/use-case/auth/login.use-case';
import { LogoutUseCase } from '../application/use-case/auth/logout.use-case';

// Infrastructure Implementations
import { PrismaUserRepository } from '../infrastructure/persistence/repository/user.repository.impl';
import { PrismaTokenRepository } from '../infrastructure/persistence/repository/token.repository.impl';
import { RedisCache } from '../infrastructure/cache/redis.cache.impl';
import { BcryptPasswordHasher } from '../infrastructure/security/bcrypt.password-hasher.impl';
import { JwtTokenGenerator } from '../infrastructure/security/jwt.token-generator.impl';
import { SmtpNotification } from '../infrastructure/notification/smtp.notification.impl';

// Controllers
import { AuthController } from '../presentation/http/auth.controller';

/**
 * Dependency Injection Container
 *
 * Binds interfaces to implementations
 * Follows Dependency Inversion Principle
 */
export const diContainer = new Container();

// ===== Infrastructure Layer =====

// Persistence
diContainer
    .bind<IUserRepository>(TYPES.IUserRepository)
    .to(PrismaUserRepository)
    .inSingletonScope();
diContainer
    .bind<ITokenRepository>(TYPES.ITokenRepository)
    .to(PrismaTokenRepository)
    .inSingletonScope();

// Cache
diContainer
    .bind<ICachePort>(TYPES.ICachePort)
    .toConstantValue(new RedisCache(process.env.REDIS_URI!));

// Security
diContainer.bind<PasswordHasher>(TYPES.PasswordHasher).to(BcryptPasswordHasher).inSingletonScope();
diContainer.bind<TokenGenerator>(TYPES.TokenGenerator).to(JwtTokenGenerator).inSingletonScope();

// Notification
diContainer.bind<INotificationPort>(TYPES.INotificationPort).toConstantValue(
    new SmtpNotification({
        host: process.env.SMTP_HOST!,
        port: parseInt(process.env.SMTP_PORT!),
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
    }),
);

// ===== Application Layer =====

// Use Cases
diContainer.bind<RegisterUseCase>(TYPES.RegisterUseCase).to(RegisterUseCase).inSingletonScope();
diContainer.bind<LoginUseCase>(TYPES.LoginUseCase).to(LoginUseCase).inSingletonScope();
diContainer.bind<LogoutUseCase>(TYPES.LogoutUseCase).to(LogoutUseCase).inSingletonScope();

// ===== Presentation Layer =====

// Controllers
diContainer.bind<AuthController>(TYPES.AuthController).to(AuthController).inSingletonScope();
```

```typescript
// src/di/types.ts

export const TYPES = {
    // Repository Interfaces
    IUserRepository: Symbol.for('IUserRepository'),
    ITokenRepository: Symbol.for('ITokenRepository'),

    // Service Interfaces
    ICachePort: Symbol.for('ICachePort'),
    INotificationPort: Symbol.for('INotificationPort'),
    PasswordHasher: Symbol.for('PasswordHasher'),
    TokenGenerator: Symbol.for('TokenGenerator'),

    // Use Cases
    RegisterUseCase: Symbol.for('RegisterUseCase'),
    LoginUseCase: Symbol.for('LoginUseCase'),
    LogoutUseCase: Symbol.for('LogoutUseCase'),

    // Controllers
    AuthController: Symbol.for('AuthController'),
};
```

---

## 4. Entry Point - Bootstrap

```typescript
// src/index.ts

import express from 'express';
import { diContainer } from './di/container';
import { TYPES } from './di/types';
import { AuthController } from './presentation/http/auth.controller';
import { errorHandler } from './presentation/http/middleware/error-handler.middleware';
import { authConfig } from './config';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authController = diContainer.get<AuthController>(TYPES.AuthController);
app.use('/auth', authController.routes);

// Error Handler
app.use(errorHandler);

// Start
const PORT = authConfig.PORT || 8081;
app.listen(PORT, () => {
    console.log(`🚀 Auth Service running on port ${PORT}`);
});
```

---

## 5. Key Principles Summary

| Principle                 | Description                                    | Implementation                                                          |
| ------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| **Dependency Rule**       | Dependencies point inward                      | Domain has no dependencies, Infrastructure depends on Domain interfaces |
| **Dependency Inversion**  | Depend on abstractions, not concretions        | Repository interfaces in Domain, implementations in Infrastructure      |
| **Single Responsibility** | Each class has one reason to change            | Entities = business rules, UseCases = orchestration, Controllers = HTTP |
| **Interface Segregation** | Many small interfaces                          | Separate IUserRepository, ITokenRepository, ICachePort                  |
| **Open/Closed**           | Open for extension, closed for modification    | Add new UseCases without modifying Entities                             |
| **Hexagonal Ports**       | Business logic isolated from external concerns | Repository/Service interfaces as Ports, Prisma/Redis as Adapters        |

---

## 6. Testing Strategy

```typescript
// tests/unit/user.entity.test.ts

import { User } from '../../src/domain/entity/user.entity';
import { MockPasswordHasher } from '../mocks/mock-password-hasher';

describe('User Entity', () => {
    it('should create user with valid data', () => {
        const result = User.create({
            username: 'testuser',
            email: 'test@example.com',
            passwordHash: 'hash',
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.username).toBe('testuser');
    });

    it('should reject invalid username', () => {
        const result = User.create({
            username: 'a', // Too short
            email: 'test@example.com',
            passwordHash: 'hash',
        });

        expect(result.isFailure).toBe(true);
    });

    it('should lock account after 5 failed logins', () => {
        const user = User.fromPersistence({
            id: '1',
            username: 'test',
            email: 'test@example.com',
            passwordHash: 'hash',
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
            // ... other props
        });

        for (let i = 0; i < 5; i++) {
            user.recordFailedLogin();
        }

        expect(user.lockedUntil).not.toBeNull();
    });
});

// tests/integration/register.use-case.test.ts

import { RegisterUseCase } from '../../src/application/use-case/auth/register.use-case';
import { InMemoryUserRepository } from '../fixtures/in-memory-user.repository';
import { MockNotificationPort } from '../mocks/mock-notification.port';

describe('Register Use Case', () => {
    let useCase: RegisterUseCase;
    let userRepo: InMemoryUserRepository;
    let notification: MockNotificationPort;

    beforeEach(() => {
        userRepo = new InMemoryUserRepository();
        notification = new MockNotificationPort();
        useCase = new RegisterUseCase(
            userRepo,
            notification,
            new MockCachePort(),
            new MockPasswordHasher(),
            new MockTokenGenerator(),
        );
    });

    it('should register user and send email', async () => {
        const result = await useCase.execute({
            username: 'newuser',
            email: 'new@example.com',
            password: 'Password123',
        });

        expect(result.isSuccess).toBe(true);
        expect(notification.emailsSent).toHaveLength(1);
    });
});
```

---

## 7. Migration Path

Để áp dụng Clean Architecture vào dự án của bạn:

1. **Bắt đầu từ Domain layer** - Tạo Entities và Repository interfaces trước
2. **Implement Infrastructure** - Tạo Prisma repository implementations
3. **Build Use Cases** - Orchestrate business logic
4. **Wire with DI** - Sử dụng InversifyJS hoặc manual DI
5. **Add Controllers** - HTTP layer mỏng
6. **Test từng layer** - Unit test entities, integration test use cases

### Thứ tự refactoring đề xuất:

1. **Tạo cấu trúc folder** - Tạo tất cả các thư mục rỗng theo cấu trúc chuẩn
2. **Domain Entity** - Chuyển types sang entities
3. **Repository Interfaces** - Định nghĩa ports
4. **Infrastructure** - Implement repositories với Prisma
5. **Use Cases** - Refactor logic từ controller sang use case
6. **Controllers** - Làm thin controller layer
7. **DI Container** - Wire tất cả lại với nhau
8. **Tests** - Thêm test cho từng layer

---

**Tài liệu tham khảo:**

- [Clean Architecture by Robert C. Martin](https://www.amazon.com/Clean-Architecture-Craftsman-Software-Structure-Pragmatic/dp/0134494164)
- [Hexagonal Architecture](https://alistair.cockburn.us/2012/12/the-hexagonal-architecture/)
- [Onion Architecture](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)
