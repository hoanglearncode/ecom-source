/**
 * Result Type - For handling operations that can fail
 * Provides a type-safe way to return either success or error
 * without throwing exceptions
 *
 * Usage:
 * - Success: Result.ok(data)
 * - Error: Result.error(code, message, statusCode)
 */

// ============================================================
// Result Types
// ============================================================

export interface Success<T> {
    success: true;
    data: T;
}

export interface Failure {
    success: false;
    error: {
        code: string;
        message: string;
        statusCode: number;
        details?: unknown;
    };
}

export type ResultType<T> = Success<T> | Failure;

// ============================================================
// Result Factory
// ============================================================

export class Result {
    /**
     * Create a successful result with data
     */
    static ok<T>(data: T): ResultType<T> {
        return {
            success: true,
            data,
        };
    }

    /**
     * Create a failed result with error
     */
    static error<T>(
        code: string,
        message: string,
        statusCode: number = 400,
        details?: unknown,
    ): ResultType<T> {
        return {
            success: false,
            error: {
                code,
                message,
                statusCode,
                details,
            },
        };
    }

    /**
     * Create from domain error
     */
    static fromDomainError<T>(domainError: { code: string; message: string; statusCode: number }): ResultType<T> {
        return Result.error<T>(
            domainError.code,
            domainError.message,
            domainError.statusCode,
        );
    }

    /**
     * Check if result is successful
     */
    static isSuccess<T>(result: ResultType<T>): result is Success<T> {
        return result.success === true;
    }

    /**
     * Check if result is failed
     */
    static isFailure<T>(result: ResultType<T>): result is Failure {
        return result.success === false;
    }

    /**
     * Get data from success result or throw if failed
     */
    static getData<T>(result: ResultType<T>): T {
        if (Result.isSuccess(result)) {
            return result.data;
        }
        throw new Error(`Cannot get data from failed result: ${result.error.message}`);
    }

    /**
     * Get error from failed result or throw if success
     */
    static getError<T>(result: ResultType<T>): Failure['error'] {
        if (Result.isFailure(result)) {
            return result.error;
        }
        throw new Error('Cannot get error from successful result');
    }

    /**
     * Unwrap result - throw if failed, return data if success
     * Useful for chaining with throwOnError()
     */
    static unwrap<T>(result: ResultType<T>): T {
        if (Result.isSuccess(result)) {
            return result.data;
        }
        // Throw structured error that error handler can catch
        const error = new Error(result.error.message);
        (error as any).code = result.error.code;
        (error as any).statusCode = result.error.statusCode;
        (error as any).details = result.error.details;
        (error as any).isOperational = true;
        throw error;
    }

    /**
     * Throw error if result is failed, do nothing if success
     * Use this to convert Result to thrown exception
     */
    static throwOnError<T>(result: ResultType<T>): void {
        if (Result.isFailure(result)) {
            const error = new Error(result.error.message);
            (error as any).code = result.error.code;
            (error as any).statusCode = result.error.statusCode;
            (error as any).details = result.error.details;
            (error as any).isOperational = true;
            throw error;
        }
    }

    /**
     * Map success data to new type
     */
    static map<T, U>(result: ResultType<T>, fn: (data: T) => U): ResultType<U> {
        if (Result.isSuccess(result)) {
            return Result.ok(fn(result.data));
        }
        return result as ResultType<U>;
    }

    /**
     * Chain multiple operations
     */
    static chain<T, U>(
        result: ResultType<T>,
        fn: (data: T) => ResultType<U>
    ): ResultType<U> {
        if (Result.isSuccess(result)) {
            return fn(result.data);
        }
        return result as ResultType<U>;
    }
}

// ============================================================
// Result Extensions for Controllers
// =================================================

export interface ResultHandlerOptions {
    throwOnError?: boolean; // If true, throw error (for middleware). If false, return result (for controller to handle)
}

/**
 * Handle result in controller - either throw or send response
 */
export class ResultHandler {
    /**
     * Handle result - send error response if failed, call success callback if success
     * Returns true if handled (should return), false if not (continue)
     */
    static handle<T>(
        res: any,
        result: ResultType<T>,
        onSuccess?: (data: T) => void
    ): boolean {
        if (Result.isFailure(result)) {
            res.status(result.error.statusCode).json({
                success: false,
                error: {
                    code: result.error.code,
                    message: result.error.message,
                },
                meta: {
                    timestamp: new Date().toISOString(),
                },
            });
            return true; // Handled (send response)
        }

        if (onSuccess) {
            onSuccess(result.data);
        }
        return false; // Not handled (continue)
    }

    /**
     * Handle result with throw - throws error if failed
     */
    static handleOrThrow<T>(result: ResultType<T>): T {
        return Result.unwrap(result);
    }
}

// ============================================================
// Common Results
// ============================================================

export class CommonResults {
    static validationError(errors: Array<{ field: string; message: string }>): ResultType<never> {
        return Result.error('VALIDATION_ERROR', 'Validation failed', 400, { errors });
    }

    static notFound(resource: string = 'Resource'): ResultType<never> {
        return Result.error('NOT_FOUND', `${resource} not found`, 404);
    }

    static unauthorized(message: string = 'Authentication required'): ResultType<never> {
        return Result.error('UNAUTHORIZED', message, 401);
    }

    static forbidden(message: string = 'Access forbidden'): ResultType<never> {
        return Result.error('FORBIDDEN', message, 403);
    }

    static conflict(message: string = 'Resource already exists'): ResultType<never> {
        return Result.error('CONFLICT', message, 409);
    }
}
