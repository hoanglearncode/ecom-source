# 📋 Implementation Checklist - Auth Service

> **Trạng thái hiện tại:** Structure đã có theo Clean Architecture/DDD nhưng đa số file vẫn trống.
> **Cập nhật:** 2025-01-19

---

## 🔥 PRIORITY ORDER (LÀM THEO THỨ TỰ)

### ✅ Phase 1: Domain Layer (Foundation)

#### 1.1 Value Objects

```
□ src/domain/value-object/email.vo.ts
  - Email validation logic
  - Format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/

□ src/domain/value-object/password.vo.ts
  - Password strength validation (min 8 chars, uppercase, lowercase, number, special char)
  - Method: validateStrength(password: string): Result<void>

□ src/domain/value-object/result.vo.ts (hoặc tạo mới)
  - Result<T> class for error handling without exceptions
  - Methods: ok(), fail(), map(), flatMap()
```

#### 1.2 Service Interfaces (Domain Services)

```
□ src/domain/service-interface/password-hasher.interface.ts
  - interface PasswordHasher {
      hash(plain: string): Promise<string>
      verify(plain: string, hash: string): Promise<boolean>
    }

□ src/domain/service-interface/token-generator.interface.ts
  - interface TokenGenerator {
      generateAccessToken(payload: any): Promise<string>
      generateRefreshToken(payload: any): Promise<string>
      verifyToken(token: string): Promise<any>
      generateTokenPair(user: User): Promise<TokenPair>
    }

□ src/domain/service-interface/index.ts
  - Export all service interfaces
```

#### 1.3 Entities

```
□ src/domain/entity/user.entity.ts
  - Properties: id, username, email, phone, passwordHash, role, status, ...
  - Methods:
    ✓ create(props): Result<User> - Factory method
    ✓ fromPersistence(props): User - Reconstruct from DB
    ✓ verifyPassword(plain, hasher): boolean
    ✓ recordFailedLogin(): void - Auto-lock after 5 attempts
    ✓ recordSuccessfulLogin(ip): void
    ✓ canLogin(): Result<void> - Check status, lock, etc.
    ✓ changePassword(newHash, oldPasswords): Result<void>
    ✓ ban(): void
    ✓ unban(): void
    ✓ markAsVerified(): void
    ✓ softDelete(): void
    ✓ toPersistence(): UserProps

□ src/domain/entity/token.entity.ts
  - Properties: id, userId, accessJti, refreshToken, deviceId, ...
  - Methods:
    ✓ isExpired(): boolean
    ✓ revoke(): void
    ✓ isRefreshable(): boolean

□ src/domain/entity/twoFactor.entity.ts
  - Properties: id, userId, type, secret, backupCodes, isEnabled, ...
  - Methods:
    ✓ generateSecret(): string
    ✓ verifyCode(code: string): boolean
    ✓ generateBackupCodes(): string[]
    ✓ enable(): void
    ✓ disable(): void
```

#### 1.4 Repository Interfaces (Ports)

```
□ src/domain/repository-interface/user.repository.interface.ts
  - Already exists but verify it has:
    ✓ save(user: User): Promise<Result<void>>
    ✓ findById(id: string): Promise<User | null>
    ✓ findByUsername(username: string): Promise<User | null>
    ✓ findByEmail(email: string): Promise<User | null>
    ✓ findByPhone(phone: string): Promise<User | null>
    ✓ findMany(filter: UserFilter): Promise<User[]>
    ✓ softDelete(id: string): Promise<Result<void>>

□ src/domain/repository-interface/token.repository.interface.ts
  - Verify it has:
    ✓ save(token: Token): Promise<Result<void>>
    ✓ findByRefreshToken(hash: string): Promise<Token | null>
    ✓ revoke(id: string): Promise<Result<void>>
    ✓ revokeAllByUserId(userId: string): Promise<Result<void>>

□ src/domain/repository-interface/cache.port.interface.ts
  - Verify it has:
    ✓ get<T>(key: string): Promise<T | null>
    ✓ set<T>(key: string, value: T, ttl?: number): Promise<void>
    ✓ delete(key: string): Promise<void>
    ✓ addToBlacklist(jti: string, ttl: number): Promise<void>
    ✓ isBlacklisted(jti: string): Promise<boolean>

□ src/domain/repository-interface/index.ts
  - Export all interfaces
```

---

### 🔧 Phase 2: Infrastructure Layer

#### 2.1 Security Services

```
□ src/infrastructure/security/bcrypt.password-hasher.impl.ts
  - Implement PasswordHasher interface
  - Use bcrypt with salt rounds = 12
  - Methods: hash(), verify()

□ src/infrastructure/security/jwt.token-generator.impl.ts
  - Implement TokenGenerator interface
  - Use authConfig.JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
  - Methods:
    ✓ generateAccessToken(payload): sign with JWT_ACCESS_SECRET, 15m expiry
    ✓ generateRefreshToken(payload): sign with JWT_REFRESH_SECRET, 7d expiry
    ✓ verifyToken(token): check both secrets
    ✓ generateTokenPair(user): return { accessToken, refreshToken, expiresAt }

□ src/infrastructure/security/index.ts
  - Export implementations
```

#### 2.2 Cache

```
□ src/infrastructure/cache/redis.cache.impl.ts
  - Implement ICachePort interface
  - Use ioredis
  - Methods:
    ✓ get(), set(), delete()
    ✓ addToBlacklist(jti, ttl): set with TTL
    ✓ isBlacklisted(jti): check if exists

□ src/infrastructure/cache/index.ts
  - Export
```

#### 2.3 Repositories (Implementations)

```
□ src/infrastructure/persistence/repository/user.repository.ts
  - Implement IUserRepository using Prisma
  - Map between Prisma User model and Domain User entity
  - Key methods:
    ✓ save(): prisma.user.upsert()
    ✓ findById(), findByEmail(), findByUsername(), findByPhone()
    ✓ findMany() with filtering
    ✓ softDelete()

□ src/infrastructure/persistence/repository/token.repository.ts
  - Implement ITokenRepository using Prisma
  - Methods:
    ✓ save() with hashed refreshToken
    ✓ findByRefreshToken() with hash comparison
    ✓ revoke() - set isRevoked = true
    ✓ revokeAllByUserId()

□ src/infrastructure/persistence/repository/index.ts
  - Export
```

#### 2.4 Messaging (Optional)

```
□ src/infrastructure/messaging/kafka.producer.impl.ts
  - For audit events, notifications
```

---

### 💼 Phase 3: Application Layer (Use Cases)

#### 3.1 Auth Use Cases

```
□ src/application/use-case/auth/register.use-case.ts
  - Dependencies: userRepo, passwordHasher, tokenGenerator, cache, notification
  - Flow:
    1. Validate input (password strength, email format)
    2. Check duplicates (username, email, phone)
    3. Hash password
    4. Create User entity with User.create()
    5. Save user
    6. Generate verification token
    7. Cache verification token
    8. Send verification email
    9. Return RegisterResponseDTO

□ src/application/use-case/auth/login.use-case.ts
  - Dependencies: userRepo, passwordHasher, tokenGenerator, tokenRepo, cache
  - Flow:
    1. Find user (try email, username, phone)
    2. Verify password with user.verifyPassword()
    3. Check if user.canLogin()
    4. Record successful login
    5. Check 2FA - if enabled, return 2FA challenge
    6. Generate token pair
    7. Save token with device info
    8. Cache user data
    9. Return LoginResponseDTO

□ src/application/use-case/auth/logout.use-case.ts
  - Dependencies: tokenRepo, cache
  - Flow:
    1. Get token from request
    2. Extract jti from token
    3. Revoke token in DB
    4. Add jti to blacklist in cache
    5. Return success

□ src/application/use-case/auth/refresh-token.use-case.ts
  - Flow:
    1. Verify refresh token
    2. Find token in DB
    3. Check if token.isRevoked() or isExpired()
    4. Get user
    5. Generate new token pair
    6. Revoke old refresh token
    7. Save new token
    8. Return new tokens

□ src/application/use-case/auth/verify-email.use-case.ts
  - Flow:
    1. Get verification token from cache
    2. If not found or expired, return error
    3. Get user
    4. user.markAsVerified()
    5. Save user
    6. Delete verification token from cache
    7. Return success

□ src/application/use-case/auth/change-password.use-case.ts
  - Flow:
    1. Get user from JWT
    2. Verify old password
    3. Validate new password strength
    4. Hash new password
    5. user.changePassword(newHash, oldPasswords)
    6. Save user
    7. Revoke all tokens (security)
    8. Return success

□ src/application/use-case/auth/forgot-password.use-case.ts
  - Flow:
    1. Find user by email
    2. Generate reset token
    3. Cache token with TTL
    4. Send reset email
    5. Return success (always - to prevent email enumeration)

□ src/application/use-case/auth/reset-password.use-case.ts
  - Flow:
    1. Verify reset token from cache
    2. Get user
    3. Hash new password
    4. Update user password
    5. Delete reset token
    6. Return success
```

#### 3.2 2FA Use Cases

```
□ src/application/use-case/2fa/enable-2fa.use-case.ts
□ src/application/use-case/2fa/verify-2fa.use-case.ts
□ src/application/use-case/2fa/disable-2fa.use-case.ts
```

#### 3.3 Token Use Cases

```
□ src/application/use-case/token/revoke-all.use-case.ts
□ src/application/use-case/token/list-active.use-case.ts
```

---

### 🎨 Phase 4: Presentation Layer

#### 4.1 Controllers

```
□ src/presentation/http/auth.controller.ts
  - Currently has skeleton - fill in:
    ✓ POST /register → RegisterUseCase
    ✓ POST /login → LoginUseCase
    ✓ POST /logout → LogoutUseCase
    ✓ POST /refresh-token → RefreshTokenUseCase
    ✓ POST /verify-email → VerifyEmailUseCase
    ✓ POST /forgot-password → ForgotPasswordUseCase
    ✓ POST /reset-password → ResetPasswordUseCase
    ✓ PUT /change-password → ChangePasswordUseCase
  - Use HttpResponse formatter

□ src/presentation/http/token.controller.ts
  - Routes:
    ✓ GET /tokens - List active tokens
    ✓ DELETE /tokens/:id - Revoke specific token
    ✓ DELETE /tokens/all - Revoke all tokens
```

#### 4.2 Middleware

```
□ src/presentation/http/middleware/auth.middleware.ts
  - Current implementation is basic - ENHANCE IT:
    ✓ Use JwtTokenGenerator (not raw jwt)
    ✓ Check token blacklist in cache
    ✓ Extract jti from token and add to req
    ✓ Get full user from cache/DB and add to req.user
    ✓ Handle both access and refresh tokens
    ✓ Return proper DomainError if invalid/blacklisted

□ src/presentation/http/middleware/error-handler.middleware.ts
  - Catch all errors
  - Map DomainError to HTTP response
  - Log errors
  - Return consistent error format

□ src/shared/types/express.d.ts
  - Extend Request interface:
    ✓ user: any (hoặc proper User type)
    ✓ userId: string
    ✓ jti: string (JWT ID)
```

#### 4.3 Response Formatter

```
□ src/presentation/response-formatter/index.ts
  - HttpResponse class with methods:
    ✓ ok(res, data)
    ✓ created(res, data)
    ✓ badRequest(res, message, details)
    ✓ unauthorized(res, message)
    ✓ forbidden(res, message)
    ✓ notFound(res, message)
    ✓ internalError(res, message)
```

---

### 🔗 Phase 5: DI Container

```
□ src/di/type.ts
  - Define all TYPES symbols:
    ✓ IUserRepository, ITokenRepository, ICachePort
    ✓ PasswordHasher, TokenGenerator
    ✓ RegisterUseCase, LoginUseCase, LogoutUseCase, ...
    ✓ AuthController, TokenController

□ src/di/container.ts
  - Wire all dependencies:
    ✓ Bind repositories to implementations
    ✓ Bind services to implementations
    ✓ Bind use cases with their dependencies
    ✓ Bind controllers
  - Use inversifyjs or manual DI
```

---

### 🚀 Phase 6: Bootstrap

```
□ src/index.ts
  - Currently only has health check - ADD:
    ✓ Setup Express middleware (JSON parser, cors, etc.)
    ✓ Initialize DI container
    ✓ Get controllers from DI
    ✓ Register routes with prefix (/api/v1/auth, /api/v1/tokens)
    ✓ Setup auth middleware for protected routes
    ✓ Setup error handler middleware
    ✓ Connect to Prisma (test connection)
    ✓ Connect to Redis
    ✓ Graceful shutdown handlers
    ✓ Start server
```

---

## 📁 FILE STATUS SUMMARY

| File                                              | Status        | Notes                       |
| ------------------------------------------------- | ------------- | --------------------------- |
| `domain/entity/user.entity.ts`                    | 🟡 Empty      | **PRIORITY** - Core entity  |
| `domain/entity/token.entity.ts`                   | 🟡 Empty      | Needs implementation        |
| `domain/entity/twoFactor.entity.ts`               | 🟡 Empty      | Optional for later          |
| `domain/service-interface/*.ts`                   | 🟡 Empty      | Define contracts first      |
| `domain/repository-interface/*.ts`                | 🟢 OK         | Already defined             |
| `domain/domain-error/error.ts`                    | 🟢 OK         | Already comprehensive       |
| `infrastructure/security/*.ts`                    | 🟡 Empty      | **PRIORITY** - JWT, bcrypt  |
| `infrastructure/cache/redis.cache.impl.ts`        | 🟡 Unknown    | Check implementation        |
| `infrastructure/persistence/repository/*.ts`      | 🟡 Unknown    | Check Prisma mapping        |
| `application/use-case/auth/*.ts`                  | 🔴 Missing    | **CRITICAL** - No use cases |
| `application/dto/*.ts`                            | 🟢 OK         | DTOs are defined            |
| `presentation/http/middleware/auth.middleware.ts` | 🟡 Basic      | Needs enhancement           |
| `presentation/http/auth.controller.ts`            | 🔴 Skeleton   | Needs implementation        |
| `di/container.ts`                                 | 🟡 Unknown    | Check DI setup              |
| `index.ts`                                        | 🔴 Incomplete | Only has health check       |

---

## 🎯 QUICK START RECOMMENDATION

Nếu bạn muốn bắt đầu **ngay lập tức**, làm theo thứ tự này:

1. **Domain Entity** (`user.entity.ts`) - 2-3 hours
2. **Service Interfaces** - 30 minutes
3. **Infrastructure Services** (`jwt.token-generator.impl.ts`, `bcrypt.password-hasher.impl.ts`) - 1 hour
4. **Repository Implementations** (`user.repository.ts`, `token.repository.ts`) - 2 hours
5. **Use Cases** (`register.use-case.ts`, `login.use-case.ts`) - 3 hours
6. **DI Container** - 1 hour
7. **Controllers** - 1 hour
8. **Middleware Enhancement** - 1 hour
9. **Bootstrap** (`index.ts`) - 1 hour

**Total estimate:** ~12-15 hours for core auth functionality

---

## 🔗 RELATED FILES

- `CLEAN_ARCHITECTURE.md` - Detailed Clean Architecture guide
- `prisma/schema.prisma` - Database schema (comprehensive, ready to use)
- `src/config/index.ts` - Configuration (JWT secrets, etc.)

---

**Last updated:** 2025-01-19
