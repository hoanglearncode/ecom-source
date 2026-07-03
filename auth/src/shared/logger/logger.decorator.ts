/**
 * Logger Decorators and Utilities
 * Provides decorators for automatic method logging
 */

import { logger } from './logger.js';
import { LogLevel } from './logger.types.js';

/**
 * Method logger decorator options
 */
interface LogMethodOptions {
    level?: LogLevel;
    logArgs?: boolean;
    logResult?: boolean;
    logError?: boolean;
    includeTiming?: boolean;
    customMessage?: string;
    maxArgLength?: number;
    sanitizeArgs?: boolean;
}

/**
 * Default options for method logging
 */
const defaultMethodOptions: LogMethodOptions = {
    level: LogLevel.DEBUG,
    logArgs: true,
    logResult: false,
    logError: true,
    includeTiming: true,
    maxArgLength: 100,
    sanitizeArgs: true,
};

/**
 * Sanitize arguments to remove sensitive information
 */
function sanitizeArgs(args: any[]): any[] {
    return args.map((arg) => {
        if (!arg || typeof arg !== 'object') {
            return arg;
        }

        if (Array.isArray(arg)) {
            return arg.map(sanitizeArgs);
        }

        const sanitized = { ...arg };
        const sensitiveKeys = [
            'password',
            'newPassword',
            'oldPassword',
            'confirmPassword',
            'currentPassword',
            'token',
            'accessToken',
            'refreshToken',
            'secret',
            'apiKey',
            'creditCard',
            'ssn',
            'authorization',
        ];

        for (const key of sensitiveKeys) {
            if (key in sanitized) {
                sanitized[key] = '[REDACTED]';
            }
        }

        return sanitized;
    });
}

/**
 * Truncate string to maximum length
 */
function truncate(value: any, maxLength: number): any {
    if (typeof value === 'string' && value.length > maxLength) {
        return `${value.substring(0, maxLength)}...`;
    }
    return value;
}

/**
 * Format arguments for logging
 */
function formatArgs(args: any[], options: LogMethodOptions): string {
    try {
        let processedArgs = options.sanitizeArgs ? sanitizeArgs(args) : args;

        if (options.maxArgLength) {
            processedArgs = processedArgs.map((arg) =>
                truncate(arg, options.maxArgLength as number),
            );
        }

        return JSON.stringify(processedArgs, (key, value) => {
            // Handle circular references
            if (typeof value === 'object' && value !== null) {
                if (value.constructor && value.constructor.name === 'Object') {
                    return value;
                }
                return `[${value.constructor.name}]`;
            }
            return value;
        });
    } catch {
        return '[unable to serialize arguments]';
    }
}

/**
 * Method decorator for logging method calls
 */
export function LogMethod(options?: Partial<LogMethodOptions>): MethodDecorator {
    const opts = { ...defaultMethodOptions, ...options };

    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const className = target.constructor.name;

        descriptor.value = async function (...args: any[]) {
            const methodName = String(propertyKey);
            const message = opts.customMessage || `${className}.${methodName}`;
            const methodLogger = logger.child({ method: methodName, class: className });

            // Log method entry
            if (opts.logArgs) {
                const argsStr = formatArgs(args, opts);
                methodLogger.debug(`Entering: ${message}`, { args: argsStr });
            } else {
                methodLogger.debug(`Entering: ${message}`);
            }

            const startTime = opts.includeTiming ? Date.now() : null;

            try {
                // Execute original method
                const result = await originalMethod.apply(this, args);

                // Log method exit with timing
                if (opts.includeTiming && startTime) {
                    const duration = Date.now() - startTime;

                    if (opts.logResult) {
                        const resultStr =
                            typeof result === 'object'
                                ? JSON.stringify(result, null, 2)
                                : String(result);
                        methodLogger.debug(`Exiting: ${message}`, {
                            duration: `${duration}ms`,
                            result: resultStr,
                        });
                    } else {
                        methodLogger.debug(`Exiting: ${message}`, { duration: `${duration}ms` });
                    }
                } else if (opts.logResult) {
                    const resultStr =
                        typeof result === 'object'
                            ? JSON.stringify(result, null, 2)
                            : String(result);
                    methodLogger.debug(`Exiting: ${message}`, { result: resultStr });
                } else {
                    methodLogger.debug(`Exiting: ${message}`);
                }

                return result;
            } catch (error) {
                // Log method error
                const duration = opts.includeTiming && startTime ? Date.now() - startTime : null;

                if (opts.logError) {
                    methodLogger.error(`Error in: ${message}`, {
                        error: error instanceof Error ? error : undefined,
                        duration: duration ? `${duration}ms` : undefined,
                    });
                }

                throw error;
            }
        };

        return descriptor;
    };
}

/**
 * Class decorator for logging all methods in a class
 */
export function LogClass(options?: Partial<LogMethodOptions>): ClassDecorator {
    return function (target: any) {
        const propertyNames = Object.getOwnPropertyNames(target.prototype);

        for (const propertyName of propertyNames) {
            const descriptor = Object.getOwnPropertyDescriptor(target.prototype, propertyName);

            if (
                descriptor &&
                typeof descriptor.value === 'function' &&
                propertyName !== 'constructor'
            ) {
                LogMethod(options)(target.prototype, propertyName, descriptor);
                Object.defineProperty(target.prototype, propertyName, descriptor);
            }
        }
    };
}

/**
 * Async function wrapper for manual logging
 */
export function withLogging<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: string,
    options?: Partial<LogMethodOptions>,
): T {
    const opts = { ...defaultMethodOptions, ...options };

    return (async (...args: any[]) => {
        const methodLogger = logger.child({ function: context });

        if (opts.logArgs) {
            const argsStr = formatArgs(args, opts);
            methodLogger.debug(`Entering: ${context}`, { args: argsStr });
        }

        const startTime = opts.includeTiming ? Date.now() : null;

        try {
            const result = await fn(...args);

            if (opts.includeTiming && startTime) {
                const duration = Date.now() - startTime;
                methodLogger.debug(`Exiting: ${context}`, { duration: `${duration}ms` });
            } else {
                methodLogger.debug(`Exiting: ${context}`);
            }

            return result;
        } catch (error) {
            if (opts.logError) {
                methodLogger.error(`Error in: ${context}`, { error });
            }
            throw error;
        }
    }) as T;
}

/**
 * Create a timed execution wrapper
 */
export async function measureTime<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
        const result = await fn();
        const duration = Date.now() - start;
        logger.debug(`Operation completed: ${operation}`, { duration: `${duration}ms` });
        return result;
    } catch (error) {
        const duration = Date.now() - start;
        logger.error(`Operation failed: ${operation}`, {
            duration: `${duration}ms`,
            error,
        });
        throw error;
    }
}

/**
 * Retry wrapper with logging
 */
export async function withRetry<T>(
    operation: string,
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000,
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            logger.debug(`Attempt ${attempt}/${maxRetries}: ${operation}`);
            const result = await fn();
            if (attempt > 1) {
                logger.info(`Success on attempt ${attempt}: ${operation}`);
            }
            return result;
        } catch (error) {
            lastError = error as Error;
            logger.warn(`Attempt ${attempt}/${maxRetries} failed: ${operation}`, {
                error: lastError.message,
            });

            if (attempt < maxRetries) {
                logger.debug(`Retrying in ${delayMs}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }

    logger.error(`All ${maxRetries} attempts failed: ${operation}`, { error: lastError });
    throw lastError;
}

/**
 * Circuit breaker pattern with logging
 */
export class CircuitBreaker {
    private failureCount = 0;
    private lastFailureTime?: number;
    private state: 'closed' | 'open' | 'half-open' = 'closed';
    private readonly failureThreshold: number;
    private readonly resetTimeoutMs: number;
    private readonly operationName: string;

    constructor(
        operationName: string,
        failureThreshold: number = 5,
        resetTimeoutMs: number = 60000,
    ) {
        this.operationName = operationName;
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (this.shouldAttemptReset()) {
                this.state = 'half-open';
                logger.info(`Circuit breaker entering half-open state: ${this.operationName}`);
            } else {
                const error = new Error(`Circuit breaker is OPEN for ${this.operationName}`);
                logger.warn(error.message, {
                    failureCount: this.failureCount,
                    lastFailureTime: this.lastFailureTime,
                });
                throw error;
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        this.failureCount = 0;
        if (this.state === 'half-open') {
            this.state = 'closed';
            logger.info(`Circuit breaker closed: ${this.operationName}`);
        }
    }

    private onFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        logger.warn(`Circuit breaker failure: ${this.operationName}`, {
            failureCount: this.failureCount,
            threshold: this.failureThreshold,
        });

        if (this.failureCount >= this.failureThreshold) {
            this.state = 'open';
            logger.error(`Circuit breaker opened: ${this.operationName}`, {
                failureCount: this.failureCount,
                threshold: this.failureThreshold,
            });
        }
    }

    private shouldAttemptReset(): boolean {
        return (
            this.lastFailureTime !== undefined &&
            Date.now() - this.lastFailureTime >= this.resetTimeoutMs
        );
    }

    getState(): string {
        return this.state;
    }

    getFailureCount(): number {
        return this.failureCount;
    }
}
