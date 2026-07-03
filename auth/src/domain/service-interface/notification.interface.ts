/**
 * Notification Service Interface
 * Defines contract for sending notifications (Email, SMS, Push)
 */

export interface INotificationService {
    // ============================================================
    // Email Operations
    // ============================================================

    /**
     * Send email
     * @param to - Recipient email address
     * @param subject - Email subject
     * @param template - Template name
     * @param data - Template data
     */
    sendEmail(to: string, subject: string, template: string, data: Record<string, unknown>): Promise<boolean>;

    /**
     * Send verification email
     * @param to - Recipient email address
     * @param verificationUrl - Verification URL with token
     * @param username - User's name
     */
    sendVerificationEmail(to: string, verificationUrl: string, username: string): Promise<boolean>;

    /**
     * Send password reset email
     * @param to - Recipient email address
     * @param resetUrl - Password reset URL with token
     * @param username - User's name
     */
    sendPasswordResetEmail(to: string, resetUrl: string, username: string): Promise<boolean>;

    /**
     * Send OTP email
     * @param to - Recipient email address
     * @param otp - One-time password code
     * @param purpose - Purpose of OTP (login, verification, etc.)
     */
    sendOTPEmail(to: string, otp: string, purpose: string): Promise<boolean>;

    /**
     * Send welcome email
     * @param to - Recipient email address
     * @param username - User's name
     */
    sendWelcomeEmail(to: string, username: string): Promise<boolean>;

    // ============================================================
    // SMS Operations
    // ============================================================

    /**
     * Send SMS
     * @param to - Recipient phone number
     * @param message - SMS message
     */
    sendSMS(to: string, message: string): Promise<boolean>;

    /**
     * Send OTP SMS
     * @param to - Recipient phone number
     * @param otp - One-time password code
     * @param purpose - Purpose of OTP
     */
    sendOTPSMS(to: string, otp: string, purpose: string): Promise<boolean>;

    /**
     * Send verification SMS
     * @param to - Recipient phone number
     * @param code - Verification code
     */
    sendVerificationSMS(to: string, code: string): Promise<boolean>;

    // ============================================================
    // Push Notification Operations
    // ============================================================

    /**
     * Send push notification
     * @param userId - User ID to receive notification
     * @param title - Notification title
     * @param body - Notification body
     * @param data - Additional data
     */
    sendPushNotification(userId: string, title: string, body: string, data?: Record<string, unknown>): Promise<boolean>;

    /**
     * Send bulk push notification
     * @param userIds - Array of user IDs
     * @param title - Notification title
     * @param body - Notification body
     * @param data - Additional data
     */
    sendBulkPushNotification(userIds: string[], title: string, body: string, data?: Record<string, unknown>): Promise<boolean>;

    // ============================================================
    // Template Management
    // ============================================================

    /**
     * Render email template
     * @param template - Template name
     * @param data - Template data
     */
    renderTemplate(template: string, data: Record<string, unknown>): Promise<string>;

    // ============================================================
    // Queue Operations
    // ============================================================

    /**
     * Queue email for later sending
     * @param to - Recipient email address
     * @param subject - Email subject
     * @param template - Template name
     * @param data - Template data
     * @param delay - Delay in seconds before sending
     */
    queueEmail(to: string, subject: string, template: string, data: Record<string, unknown>, delay?: number): Promise<boolean>;

    /**
     * Queue SMS for later sending
     * @param to - Recipient phone number
     * @param message - SMS message
     * @param delay - Delay in seconds before sending
     */
    queueSMS(to: string, message: string, delay?: number): Promise<boolean>;

    // ============================================================
    // Validation
    // ============================================================

    /**
     * Validate email address format
     * @param email - Email to validate
     */
    validateEmail(email: string): boolean;

    /**
     * Validate phone number format
     * @param phone - Phone number to validate
     */
    validatePhone(phone: string): boolean;

    // ============================================================
    // Rate Limiting
    // ============================================================

    /**
     * Check if recipient is rate limited
     * @param recipient - Email or phone number
     * @param type - Notification type
     */
    isRateLimited(recipient: string, type: 'email' | 'sms'): Promise<boolean>;

    /**
     * Get remaining send count for recipient
     * @param recipient - Email or phone number
     * @param type - Notification type
     */
    getRemainingCount(recipient: string, type: 'email' | 'sms'): Promise<number>;
}
