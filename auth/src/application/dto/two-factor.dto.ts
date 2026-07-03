/**
 * Two-Factor Authentication DTOs
 */

export interface Enable2FADto {
    password: string;
}

export interface Enable2FAResponseDto {
    qrCode: string;
    backupCodes: string[];
    message: string;
}

export interface Verify2FADto {
    token: string;
}

export interface Disable2FADto {
    password: string;
    token: string;
}
