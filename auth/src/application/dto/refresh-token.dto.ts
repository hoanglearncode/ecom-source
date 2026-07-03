/**
 * Refresh Token DTO
 */

export interface RefreshTokenDto {
    refreshToken: string;
}

export interface RefreshTokenResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // in seconds
}
