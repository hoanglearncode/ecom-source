import jwt from 'jsonwebtoken';
import { JwtPayload, RefreshJwtPayload } from '../types/index.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_key';
const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Generate Access Token
 * @param payload - User data (userId, email, role)
 * @returns Access token
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
    issuer: 'auth-service',
    audience: 'ecom-users'
  });
};

/**
 * Generate Refresh Token
 * @param payload - User data (userId)
 * @returns Refresh token
 */
export const generateRefreshToken = (payload: RefreshJwtPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
    issuer: 'auth-service',
    audience: 'ecom-users'
  });
};

/**
 * Verify Access Token
 * @param token - Access token
 * @returns Decoded payload
 * @throws Error if token is invalid or expired
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, ACCESS_SECRET, {
      issuer: 'auth-service',
      audience: 'ecom-users'
    }) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify Refresh Token
 * @param token - Refresh token
 * @returns Decoded payload
 * @throws Error if token is invalid or expired
 */
export const verifyRefreshToken = (token: string): RefreshJwtPayload => {
  try {
    return jwt.verify(token, REFRESH_SECRET, {
      issuer: 'auth-service',
      audience: 'ecom-users'
    }) as RefreshJwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Decode token without verification (for getting expiration info)
 * @param token - JWT token
 * @returns Decoded payload or null
 */
export const decodeToken = (token: string): JwtPayload | null => {
  const decoded = jwt.decode(token);
  return decoded as JwtPayload | null;
};
