/**
 * Auth Controller
 * Handles authentication endpoints: register, login, logout
 *
 * This is the Presentation Layer (Driving Adapter)
 * It receives HTTP requests and delegates to Use Cases (Application Layer)
 *
 * Routes:
 * - POST   /auth/register           - Register new account
 * - POST   /auth/login              - Login with email/username/phone
 * - POST   /auth/logout             - Logout current session
 * - POST   /auth/logout-all         - Logout all sessions
 */

import express, { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '@/presentation/response-formatter/index.js';
import { RegisterDTO, LoginDTO, LogoutDto } from '@/application/dto/index.js';
import { AuthUseCaseInterface } from '@/application/interface/auth.use-case.interface.js';
import { TYPES } from '@/di/type.js';
import { diContainer } from '@/di/container.js';
import { ResultHandler, Result } from '@/shared/result/index.js';

// ============================================================
// Auth Controller Class
// ============================================================

export class AuthController {
    private readonly authUseCase: AuthUseCaseInterface;
    public readonly router: express.Router;

    constructor() {
        // Get AuthUseCase from DI Container
        this.authUseCase = diContainer.get<AuthUseCaseInterface>(TYPES.AuthUseCase);
        this.router = express.Router();
        this.setupRoutes();
    }

    // ============================================================
    // Route Setup
    // ============================================================

    private setupRoutes(): void {
        // POST /auth/register
        this.router.post('/register', this.register.bind(this));

        // POST /auth/login
        this.router.post('/login', this.login.bind(this));

        // POST /auth/logout
        this.router.post('/logout', this.logout.bind(this));

        // POST /auth/logout-all
        this.router.post('/logout-all', this.logoutAll.bind(this));
    }

    // ============================================================
    // POST /auth/register
    // ============================================================

    private register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body: RegisterDTO = req.body;

            // Call use case
            const result = await this.authUseCase.register(body);

            // Format response
            ResponseFormatter.created(
                res,
                {
                    user: result.user,
                    tokens: {
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken,
                        expiresIn: result.expiresIn,
                    },
                    message: result.message,
                },
                {
                    timestamp: new Date().toISOString(),
                    path: '/auth/register',
                },
            );
        } catch (error) {
            next(error);
        }
    };

    // ============================================================
    // POST /auth/login
    // ============================================================

    private login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body: LoginDTO = req.body;

            // Call use case
            const result = await this.authUseCase.login(body);

            // Format response
            ResponseFormatter.success(
                res,
                {
                    user: result.user,
                    tokens: {
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken,
                        tokenType: 'Bearer',
                        expiresIn: result.expiresIn,
                    },
                },
                200,
                {
                    timestamp: new Date().toISOString(),
                    path: '/auth/login',
                },
            );
        } catch (error) {
            next(error);
        }
    };

    // ============================================================
    // POST /auth/logout
    // ============================================================

    private logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body: LogoutDto = req.body;

            // Call use case
            await this.authUseCase.logout(body);

            // Format response
            ResponseFormatter.success(
                res,
                { message: 'Logout successful' },
                200,
                {
                    timestamp: new Date().toISOString(),
                    path: '/auth/logout',
                },
            );
        } catch (error) {
            next(error);
        }
    };

    // ============================================================
    // POST /auth/logout-all
    // ============================================================

    private logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Get user ID from middleware (would be set by auth middleware)
            const userId = (req as any).user?.id;
            if (!userId) {
                ResponseFormatter.unauthorized(res, 'User not authenticated');
                return;
            }

            // Call use case
            await this.authUseCase.logoutAll(userId);

            // Format response
            ResponseFormatter.success(
                res,
                { message: 'Logged out from all devices' },
                200,
                {
                    timestamp: new Date().toISOString(),
                    path: '/auth/logout-all',
                },
            );
        } catch (error) {
            next(error);
        }
    };
}

// ============================================================
// Factory Function for Controller Creation
// ============================================================

export const buildAuthController = (): express.Router => {
    const controller = new AuthController();
    return controller.router;
};
