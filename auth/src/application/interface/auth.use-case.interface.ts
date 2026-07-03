import { UserEntity } from "@/domain/entity/user.entity.js";
import { LoginDTO } from "@/application/dto/login.dto.js";
import { RegisterDTO } from "@/application/dto/register.dto.js";
import { LogoutDto } from "@/application/dto/logout.dto.js";
import { RegisterResponse } from "@/presentation/response-formatter/auth.js";

/**
 * Authentication Use Case Interface
 * Handles core authentication operations: login, register, logout
 */
export interface AuthUseCaseInterface {
    /**
     * Authenticate user with email/username and password
     * @param data - Login credentials
     * @returns User object with tokens if successful
     */
    login(data: LoginDTO): Promise<{
        user: Omit<UserEntity, 'passwordHash'>;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;

    /**
     * Register new user account
     * @param data - Registration data
     * @returns Created user with tokens
     */
    register(data: RegisterDTO): Promise<RegisterResponse>;

    /**
     * Logout user and invalidate refresh token
     * @param data - Logout data containing refresh token
     * @returns Success status
     */
    logout(data: LogoutDto): Promise<boolean>;

    /**
     * Logout user from all devices
     * @param userId - User ID
     * @returns Success status
     */
    logoutAll(userId: string): Promise<boolean>;
}

export interface AuthReponsitoryInterface {
    /**
     * Find user by email or username
     * @param emailOrUsername - Email or username to search for
     * @returns User object if found, otherwise null
     */
    findUserByEmailOrUsername(emailOrUsername: string): Promise<UserEntity | null>;

    /**
     * Create new user in the database
     * @param user - User entity to be created
     * @returns Created user object
     */
    createUser(user: UserEntity): Promise<UserEntity>;

    /**
     * Invalidate a specific refresh token
     * @param refreshToken - Refresh token to invalidate
     * @returns Success status
     */
    invalidateRefreshToken(refreshToken: string): Promise<boolean>;

    /**
     * Invalidate all refresh tokens for a specific user
     * @param userId - User ID whose tokens should be invalidated
     * @returns Success status
     */
    invalidateAllRefreshTokens(userId: string): Promise<boolean>;
}