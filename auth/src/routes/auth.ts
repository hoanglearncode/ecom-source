import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  decodeToken
} from '../utils/jwt.js';
import { TokenBlacklist } from '../utils/tokenBlacklist.js';
import { UserModel } from '../models/user.js';
import { User, CreateUserDto, LoginDto, RefreshTokenDto, JwtPayload } from '../types/index.js';

const router = Router();

const SALT_ROUNDS = 10;

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array()
        });
        return;
      }

      const { email, password, name }: CreateUserDto & { password: string } = req.body;

      // Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User already exists with this email.'
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const userId = uuidv4();
      const userData: User = {
        userId,
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        role: 'user',
        createdAt: new Date(),
        isActive: true
      };

      const user = await UserModel.create(userData);

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.userId,
        email: user.email,
        role: user.role
      });

      const refreshToken = generateRefreshToken({ userId: user.userId });

      // Store refresh token
      await UserModel.storeRefreshToken(userId, refreshToken);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            userId: user.userId,
            email: user.email,
            name: user.name,
            role: user.role
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      next(error);
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array()
        });
        return;
      }

      const { email, password }: LoginDto = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials.'
        });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated.'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials.'
        });
        return;
      }

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.userId,
        email: user.email,
        role: user.role
      });

      const refreshToken = generateRefreshToken({ userId: user.userId });

      // Store refresh token
      await UserModel.storeRefreshToken(user.userId, refreshToken);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            userId: user.userId,
            email: user.email,
            name: user.name,
            role: user.role
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      next(error);
    }
  }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Get new access token using refresh token
 * @access  Public
 */
router.post('/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token required')
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array()
        });
        return;
      }

      const { refreshToken }: RefreshTokenDto = req.body;

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Check if refresh token exists in storage
      const isValidToken = await UserModel.verifyRefreshToken(decoded.userId, refreshToken);
      if (!isValidToken) {
        res.status(401).json({
          success: false,
          message: 'Invalid or revoked refresh token.'
        });
        return;
      }

      // Get user info
      const user = await UserModel.findById(decoded.userId);
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive.'
        });
        return;
      }

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: user.userId,
        email: user.email,
        role: user.role
      });

      res.json({
        success: true,
        data: {
          accessToken
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Invalid refresh token.'
      });
    }
  }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Private
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken, accessToken } = req.body;
    const userId = req.user?.userId;

    if (refreshToken && userId) {
      // Remove refresh token from storage
      await UserModel.removeRefreshToken(userId, refreshToken);
    }

    // Blacklist access token if provided
    if (accessToken) {
      const decoded = decodeToken(accessToken);
      if (decoded && decoded.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await TokenBlacklist.addToBlacklist(accessToken, expiresIn);
        }
      }
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    next(error);
  }
});

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices (revoke all refresh tokens)
 * @access  Private
 */
router.post('/logout-all', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accessToken } = req.body;
    const userId = req.user?.userId;

    if (userId) {
      // Revoke all user tokens
      await UserModel.removeAllRefreshTokens(userId);
      await TokenBlacklist.revokeAllUserTokens(userId);
    }

    // Blacklist current access token
    if (accessToken) {
      const decoded = decodeToken(accessToken);
      if (decoded && decoded.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await TokenBlacklist.addToBlacklist(accessToken, expiresIn);
        }
      }
    }

    res.json({
      success: true,
      message: 'Logged out from all devices'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    next(error);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    next(error);
  }
});

export default router;
