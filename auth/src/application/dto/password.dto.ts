/**
 * Password Change DTO
 */
export interface ChangePasswordDto {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

/**
 * Password Reset Request DTO
 */
export interface PasswordResetRequestDto {
    email: string;
}

/**
 * Password Reset Confirm DTO
 */
export interface PasswordResetConfirmDto {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

/**
 * Password Response DTO
 */
export interface PasswordResponseDto {
    message: string;
    success: boolean;
}
