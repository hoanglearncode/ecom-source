/**
 * Async Result Type - For handling async operations that can fail
 * Similar to Result but for Promise-based operations
 */

import { Result, ResultType } from './result.js';

// ============================================================
// Async Result Helper Functions
// ============================================================

export class AsyncResult {
    /**
     * Wrap a promise that might throw
     * Returns Result.ok(data) or Result.error() based on success/failure
     */
    public Result = new Result();
    static async fromPromise<T>(
        promise: Promise<T>,
        errorCode: string = 'OPERATION_FAILED',
        errorMessage: string = 'Operation failed',
        errorStatusCode: number = 500
    ): Promise<ResultType<T>> {
        try {
            const data = await promise;
            return Result.ok(data);
        } catch (error: any) {
            return Result.error(
                errorCode,
                error.message || errorMessage,
                error.statusCode || errorStatusCode,
                error.details
            );
        }
    }

    /**
     * Execute multiple async operations in parallel
     * Returns Result.ok() if all succeed, Result.error() if any fail
     */
    static async all<T>(
        promises: Promise<ResultType<T>>[]
    ): Promise<ResultType<T[]>> {
        try {
            const results = await Promise.all(promises);
            const data: T[] = [];

            for (const result of results) {
                if (Result.isFailure(result)) {
                    return result as ResultType<T[]>; // Propagate first error
                }
                data.push(result.data);
            }

            return Result.ok(data);
        } catch (error: any) {
            return Result.error(
                'OPERATION_FAILED',
                error.message || 'Parallel operation failed',
                500
            );
        }
    }

    /**
     * Execute promises with error handling
     * Returns array of Results (all succeed or fail independently)
     */
    static async allSettled<T>(
        promises: Promise<T>[]
    ): Promise<ResultType<T>[]> {
        return Promise.all(
            promises.map(p =>
                AsyncResult.fromPromise(p)
            )
        );
    }

    /**
     * Retry a promise with max attempts
     */
    static async retry<T>(
        fn: () => Promise<T>,
        maxAttempts: number = 3,
        delay: number = 1000
    ): Promise<ResultType<T>> {
        let lastError: any;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const data = await fn();
                return Result.ok(data);
            } catch (error: any) {
                lastError = error;
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, delay * attempt));
                }
            }
        }

        return Result.error(
            'RETRY_FAILED',
            lastError?.message || 'Operation failed after retries',
            lastError?.statusCode || 500,
            lastError?.details
        );
    }
}
