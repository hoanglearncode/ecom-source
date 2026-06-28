export interface User {
  userId: string;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt?: Date;
  isActive: boolean;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshJwtPayload {
  userId: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: Omit<User, 'password'>;
    tokens: TokenResponse;
  } | {
    accessToken: string;
  } | {
    user: Omit<User, 'password'>;
  };
  errors?: Array<{ msg: string; path: string; type: string }>;
}

export interface RequestUser {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      token?: string;
    }
  }
}
