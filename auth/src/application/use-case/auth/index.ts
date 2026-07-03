/**
 * Authentication Use Case Implementation
 * Handles login, register, and logout operations
 */

import { injectable, inject } from 'inversify';
import { LoginDTO } from '@/application/dto/login.dto.js';
import { RegisterDTO, RegisterDTOSchema } from '@/application/dto/register.dto.js';
import { LogoutDto } from '@/application/dto/logout.dto.js';
import { AuthUseCaseInterface } from '@/application/interface/auth.use-case.interface.js';
import { RegisterResponse } from '@/presentation/response-formatter/auth.js';
import { TYPES } from '@/di/type.js';
import { IUserRepository } from '@/domain/reponsitory-interface/user.reponsitory.interface.js';
import { IPasswordHasher } from '@/domain/service-interface/password-hasher.interface.js';
import { ITokenGenerator } from '@/domain/service-interface/token-generator.interface.js';
import { ITokenRepository } from '@/domain/reponsitory-interface/token.reponsitory.interface.js';
import { ICacheService } from '@/domain/service-interface/cache.interface.js';
import { UserEntity, UserStatus, UserRole } from '@/domain/entity/user.entity.js';
import {
    UserError,
    AuthError,
    TokenError,
    RateLimitError,
    ValidationError,
} from '@/domain/domain-error/error.js';
import { logger } from '@/shared/logger/index.js';
import { TokenEntity, TokenType } from '@/domain/entity/token.entity.js';

@injectable()
export class AuthUseCase implements AuthUseCaseInterface {
    // ============================================================
    // Constants
    // ============================================================

    private readonly MAX_LOGIN_ATTEMPTS = 5;
    private readonly LOCK_DURATION_MINUTES = 15;
    private readonly MAX_ACTIVE_SESSIONS = 10;
    private readonly BLACKLIST_TTL_DAYS = 30;

    // ============================================================
    // Constructor
    // ============================================================

    constructor(
        @inject(TYPES.UserRepository) private userRepository: IUserRepository,
        @inject(TYPES.PasswordHasher) private passwordHasher: IPasswordHasher,
        @inject(TYPES.TokenGenerator) private tokenGenerator: ITokenGenerator,
        @inject(TYPES.TokenRepository) private tokenRepository: ITokenRepository,
        @inject(TYPES.CacheService) private cache: ICacheService,
    ) {}

    // ============================================================
    // Login
    // ============================================================

    async login(data: LoginDTO): Promise<{
        user: Omit<UserEntity, 'passwordHash'>;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }> {
        logger.info('Login attempt', { email: data.email });

        // Find user by email or username
        const user = await this.userRepository.findByEmailOrUsername(data.email);
        if (!user) {
            logger.warn('Login failed - user not found', { email: data.email });
            throw UserError.INVALID_CREDENTIALS;
        }

        // Check if user can login
        if (!user.canLogin()) {
            if (user.status === UserStatus.BANNED) {
                logger.warn('Login failed - user banned', { userId: user.id });
                throw UserError.ACCOUNT_BANNED;
            }
            if (user.status === UserStatus.DELETED) {
                logger.warn('Login failed - user deleted', { userId: user.id });
                throw UserError.ACCOUNT_DELETED;
            }
            if (user.status === UserStatus.UNVERIFIED) {
                logger.warn('Login failed - user unverified', { userId: user.id });
                throw UserError.ACCOUNT_UNVERIFIED;
            }
            if (user.isLocked()) {
                logger.warn('Login failed - account locked', { userId: user.id });
                throw UserError.ACCOUNT_LOCKED;
            }
        }

        // Verify password
        const isValidPassword = await this.passwordHasher.verify(data.password, user.passwordHash);
        if (!isValidPassword) {
            // Record failed attempt
            await this.handleFailedLogin(user.id, data.email);
            logger.warn('Login failed - invalid password', { userId: user.id });
            throw UserError.INVALID_CREDENTIALS;
        }

        // Check active session limit
        const activeCount = await this.tokenRepository.getActiveCount(user.id);
        if (activeCount >= this.MAX_ACTIVE_SESSIONS && !data.rememberMe) {
            logger.warn('Login failed - too many sessions', { userId: user.id, activeCount });
            throw TokenError.TOO_MANY_TOKENS;
        }

        // Generate tokens
        const { accessToken, refreshToken, expiresIn } = await this.generateTokens(user.id);

        // Update last login
        await this.userRepository.updateLastLogin(user.id, '127.0.0.1');

        logger.info('Login successful', { userId: user.id });

        return {
            user: user.toPublic(),
            accessToken,
            refreshToken,
            expiresIn,
        };
    }

    // ============================================================
    // Register
    // ============================================================

    async register(data: RegisterDTO): Promise<RegisterResponse> {
        logger.info('Registration attempt', { email: data.email });
        try {
            const validationResult = RegisterDTOSchema.safeParse(data);
            if (!validationResult.success) {
                const errorMessages = validationResult.error.issues
                    .map((issue: { message: string }) => issue.message)
                    .join(', ');
                throw new ValidationError(
                    'VALIDATION_FAILED',
                    errorMessages,
                    400,
                );
            }

            // Check if email already exists
            if (data.email && await this.userRepository.emailExists(data.email)) {
                logger.warn('Registration failed - email exists', { email: data.email });
                throw UserError.EMAIL_EXISTS;
            }

            // Check if phone already exists
            if (data.phone && await this.userRepository.phoneExists(data.phone)) {
                logger.warn('Registration failed - phone exists', { phone: data.phone });
                throw UserError.PHONE_EXISTS;
            }

            // Generate username from email if not provided
            const username = data.email?.split('@')[0] || `user_${Date.now()}`;

            // Check if username exists
            if (await this.userRepository.usernameExists(username)) {
                logger.warn('Registration failed - username exists', { username });
                throw UserError.USERNAME_EXISTS;
            }

            // Hash password
            const passwordHash = await this.passwordHasher.hash(data.password);

            // Create user
            const user = UserEntity.new(username, data.email || null, data.phone || null, passwordHash);
            const userProps = user.toPersistence();

            await this.userRepository.create({
                id: userProps.id,
                username: userProps.username,
                email: userProps.email,
                phone: userProps.phone,
                passwordHash: userProps.passwordHash,
                role: userProps.role,
                status: userProps.status,
            });

            logger.info('Registration successful', { userId: user.id });

            // Generate tokens
            const { accessToken, refreshToken, expiresIn } = await this.generateTokens(user.id);

            return {
                user: {
                    id: user.id,
                    email: user.email || data.email || '', // Email is required by DTO validation
                    username: data.username,
                    phone: user.phone || undefined,
                    isVerified: user.isVerified(),
                    createdAt: user.createdAt.toISOString(),
                },
                message: 'Registration successful',
                accessToken,
                refreshToken,
                expiresIn,
            };
        }catch (error) {
            logger.error('Registration failed', { error, email: data.email });
            throw error;
        }
    }

    // ============================================================
    // Logout
    // ============================================================

    async logout(data: LogoutDto): Promise<boolean> {
        logger.info('Logout attempt', { hasRefreshToken: !!data.refreshToken });

        if (!data.refreshToken) {
            throw AuthError.INVALID_TOKEN;
        }

        // Find token by refresh token
        const token = await this.tokenRepository.findByRefreshToken(data.refreshToken);
        if (!token) {
            logger.warn('Logout failed - token not found');
            throw TokenError.REFRESH_TOKEN_NOT_FOUND;
        }

        // Revoke token
        await this.tokenRepository.revoke(token.id);

        // Add to blacklist
        await this.cache.set(
            `blacklist:${token.accessJti}`,
            { revoked: true, reason: 'LOGOUT' },
            this.BLACKLIST_TTL_DAYS * 24 * 60 * 60,
        );

        logger.info('Logout successful', { userId: token.userId });

        return true;
    }

    // ============================================================
    // Logout All
    // ============================================================

    async logoutAll(userId: string): Promise<boolean> {
        logger.info('Logout all attempt', { userId });

        // Revoke all tokens for user
        const revokedCount = await this.tokenRepository.revokeAllForUser(userId);

        logger.info('Logout all successful', { userId, revokedCount });

        return true;
    }

    // ============================================================
    // Private Helper Methods
    // ============================================================

    /**
     * Generate access and refresh tokens for user
     */
    private async generateTokens(userId: string, deviceInfo?: {
        deviceId?: string;
        deviceName?: string;
        deviceType?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }> {
        // Get user for token payload
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw UserError.NOT_FOUND;
        }

        // Generate JTI
        const accessJti = this.tokenGenerator.generateJti();
        const refreshJti = this.tokenGenerator.generateJti();

        // Calculate expiration
        const accessExpiresIn = this.parseExpiration('15m'); // 15 minutes
        const refreshExpiresIn = this.parseExpiration('7d'); // 7 days
        const accessExpiresAt = new Date(Date.now() + accessExpiresIn * 1000);
        const refreshExpiresAt = new Date(Date.now() + refreshExpiresIn * 1000);

        // Generate tokens
        const accessToken = this.tokenGenerator.generateAccessToken({
            sub: user.id,
            email: user.email || undefined,
            username: user.username,
            role: user.role,
            jti: accessJti,
        }, { expiresIn: '15m' });

        const refreshToken = this.tokenGenerator.generateRefreshToken({
            sub: user.id,
            role: user.role,
            jti: refreshJti,
        }, { expiresIn: '7d' });

        // Hash refresh token for storage
        const refreshHash = await this.passwordHasher.hash(refreshToken);

        // Store token in database
        await this.tokenRepository.create({
            userId: user.id,
            accessJti,
            refreshToken: refreshHash,
            deviceId: deviceInfo?.deviceId || null,
            deviceName: deviceInfo?.deviceName || TokenEntity.parseDeviceName(deviceInfo?.userAgent || 'Unknown'),
            deviceType: deviceInfo?.deviceType || TokenEntity.parseDeviceType(deviceInfo?.userAgent || 'Unknown'),
            ipAddress: deviceInfo?.ipAddress || null,
            userAgent: deviceInfo?.userAgent || null,
            accessExpiresAt,
            refreshExpiresAt,
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: accessExpiresIn,
        };
    }

    /**
     * Handle failed login attempt
     */
    private async handleFailedLogin(userId: string, identifier: string): Promise<void> {
        // Increment failed count
        const updatedUser = await this.userRepository.incrementFailedLoginCount(userId);

        // Check if should be locked
        if (updatedUser && updatedUser.failedLoginCount >= this.MAX_LOGIN_ATTEMPTS) {
            logger.warn('Account locked due to failed attempts', { userId, identifier });
            // Lock for 15 minutes
            await this.userRepository.lockAccount(
                userId,
                new Date(Date.now() + this.LOCK_DURATION_MINUTES * 60 * 1000),
            );
        }

        // Check for rate limiting
        const key = `login_attempts:${identifier}`;
        const attempts = await this.cache.incr(key);
        if (attempts === 1) {
            await this.cache.expire(key, 300); // 5 minutes
        }

        if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
            throw RateLimitError.TOO_MANY_LOGIN_ATTEMPTS;
        }
    }

    /**
     * Parse expiration string to seconds
     */
    private parseExpiration(exp: string): number {
        const match = exp.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error(`Invalid expiration format: ${exp}`);
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
