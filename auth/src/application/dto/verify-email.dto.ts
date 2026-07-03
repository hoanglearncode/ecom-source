/**
 * Email Verification DTO
 */

export interface VerifyEmailDto {
    token: string;
}

/**
 * Resend Verification Email DTO
 */
export interface ResendVerificationDto {
    email: string;
}
