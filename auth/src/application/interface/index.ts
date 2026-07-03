/**
 * Application Use Case Interfaces
 *
 * This module exports all use case interfaces for the authentication service.
 * These interfaces define the contracts for various authentication operations.
 */

// Core Authentication
export { AuthUseCaseInterface } from './auth.use-case.interface.js';

// Token Management
export { TokenUseCaseInterface, type TokenInfo, type TokenPayload, type DeviceInfo } from './token.use-case.interface.js';

// Password Management
export { PasswordUseCaseInterface } from './password.use-case.interface.js';

// Two-Factor Authentication
export {
    TwoFactorUseCaseInterface,
    TwoFactorType,
    type TwoFactorStatus
} from './two-factor.use-case.interface.js';

// Email/Phone Verification
export {
    VerifyUseCaseInterface,
    VerifyType,
    VerifyMethod,
    type VerificationStatus
} from './verify.use-case.interface.js';

// Session Management
export { SessionUseCaseInterface, type SessionInfo, type CreateSessionData } from './session.use-case.interface.js';

// API Key Management
export { ApiKeyUseCaseInterface } from './api-key.use-case.interface.js';

// OAuth/Social Login
export {
    OAuthUseCaseInterface,
    OAuthProvider,
    type OAuthAccountInfo,
    type OAuthUserProfile,
    type OAuthTokenResponse,
    type OAuthAuthResult
} from './oauth.use-case.interface.js';

// Internal Services
export {
    InternalUseCaseInterface,
    type UserCheckResult,
    type TokenValidationResult,
    type ServiceCheckResult,
    type AuditLogEntry
} from './internal.use-case.interface.js';
