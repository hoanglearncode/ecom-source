/**
 * Logger Types and Interfaces
 */

/**
 * Log levels supported by the logger
 */
export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    HTTP = 'http',
    DEBUG = 'debug',
}

/**
 * Log entry metadata
 */
export interface LogMetadata {
    [key: string]: any;
}

/**
 * Log context for tracking requests and user actions
 */
export interface LogContext {
    requestId?: string;
    userId?: string;
    sessionId?: string;
    ip?: string;
    userAgent?: string;
    route?: string;
    method?: string;
    [key: string]: any;
}

/**
 * Base log entry structure
 */
export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: LogContext;
    metadata?: LogMetadata;
    stack?: string;
}

/**
 * Security event types
 */
export enum SecurityEventType {
    LOGIN_SUCCESS = 'login_success',
    LOGIN_FAILED = 'login_failed',
    LOGOUT = 'logout',
    TOKEN_REFRESH = 'token_refresh',
    TOKEN_INVALID = 'token_invalid',
    TOKEN_EXPIRED = 'token_expired',
    PASSWORD_CHANGE = 'password_change',
    PASSWORD_RESET = 'password_reset',
    TWO_FACTOR_ENABLED = '2fa_enabled',
    TWO_FACTOR_DISABLED = '2fa_disabled',
    TWO_FACTOR_FAILED = '2fa_failed',
    SUSPICIOUS_ACTIVITY = 'suspicious_activity',
    RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
    UNAUTHORIZED_ACCESS = 'unauthorized_access',
}

/**
 * Security event log entry
 */
export interface SecurityEventEntry {
    eventType: SecurityEventType;
    userId?: string;
    ip?: string;
    userAgent?: string;
    resourceId?: string;
    details?: LogMetadata;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
    duration: number;
    memoryUsage?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    cpuUsage?: NodeJS.CpuUsage;
}

/**
 * Request logging options
 */
export interface RequestLoggingOptions {
    excludePaths?: string[];
    excludeMethods?: string[];
    includeQuery?: boolean;
    includeBody?: boolean;
    skipSuccessfulRequests?: boolean;
}

/**
 * Child logger options
 */
export interface ChildLoggerOptions {
    context: LogContext;
    metadata?: LogMetadata;
}
