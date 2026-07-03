/**
 * Main Logger Module
 * Provides structured logging with context awareness for the auth service
 */

import winston from 'winston';
import { LogLevel, LogContext, LogMetadata, LogEntry } from './logger.types.js';
import { authConfig } from '../../config/index.js';
import path from 'path';
import fs from 'fs';

/**
 * Custom log format that includes all relevant information
 */
const customFormat = winston.format.printf(
    ({ level, message, timestamp, context, metadata, stack, ...rest }) => {
        let log = `${timestamp as string} [${level}]: ${message}`;

        // Add context if present
        if (context && Object.keys(context).length > 0) {
            const contextStr = Object.entries(context)
                .filter(([_, value]) => value !== undefined)
                .map(([key, value]) => `${key}=${value}`)
                .join(' ');
            if (contextStr) {
                log += ` | Context: ${contextStr}`;
            }
        }

        // Add metadata if present
        if (metadata && Object.keys(metadata).length > 0) {
            try {
                log += ` | Meta: ${JSON.stringify(metadata)}`;
            } catch {
                log += ' | Meta: [unserializable]';
            }
        }

        // Add stack trace for errors
        if (stack) {
            log += `\n${stack}`;
        }

        // Add any additional fields
        const additionalFields = Object.entries(rest).filter(
            ([key]) =>
                !['level', 'message', 'timestamp', 'context', 'metadata', 'stack'].includes(key),
        );
        if (additionalFields.length > 0) {
            log += ` | Extra: ${JSON.stringify(Object.fromEntries(additionalFields))}`;
        }

        return log;
    },
);

/**
 * Create a format that enriches logs with context
 */
const contextEnrichmentFormat = winston.format((info) => {
    // Add timestamp if not present
    if (!info.timestamp) {
        info.timestamp = new Date().toISOString();
    }

    // Separate context from main info
    const contextKeys = ['requestId', 'userId', 'sessionId', 'ip', 'userAgent', 'route', 'method'];
    const context: LogContext = {};
    const metadata: LogMetadata = {};

    Object.entries(info).forEach(([key, value]) => {
        if (contextKeys.includes(key) && value !== undefined) {
            context[key as keyof LogContext] = value;
            delete info[key];
        } else if (
            !['level', 'message', 'timestamp', 'stack', 'context', 'metadata'].includes(key) &&
            value !== undefined
        ) {
            metadata[key] = value;
        }
    });

    if (Object.keys(context).length > 0) {
        info.context = context;
    }

    if (Object.keys(metadata).length > 0) {
        info.metadata = metadata;
    }

    return info;
})();

/**
 * Console format for development - colorful and readable
 */
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    contextEnrichmentFormat,
    winston.format.errors({ stack: true }),
    customFormat,
);

/**
 * File format for production - structured JSON
 */
const fileFormat = winston.format.combine(
    contextEnrichmentFormat,
    winston.format.errors({ stack: true }),
    winston.format.json(),
);

/**
 * Ensure logs directory exists
 */
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Determine log level from environment
 */
const getLogLevel = (): string => {
    const env = authConfig.NODE_ENV;
    if (env === 'production') {
        return process.env.LOG_LEVEL || 'info';
    }
    return process.env.LOG_LEVEL || 'debug';
};

/**
 * Create the base winston logger
 */
const winstonLogger = winston.createLogger({
    level: getLogLevel(),
    format: fileFormat,
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: consoleFormat,
            silent: authConfig.NODE_ENV === 'test',
        }),

        // General application logs
        new winston.transports.File({
            filename: path.join(logsDir, 'app.log'),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }),

        // Error logs
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 10,
        }),

        // Security logs (warnings and above)
        new winston.transports.File({
            filename: path.join(logsDir, 'security.log'),
            level: 'warn',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 20,
        }),

        // HTTP request logs
        new winston.transports.File({
            filename: path.join(logsDir, 'http.log'),
            level: 'http',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }),
    ],

    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
        }),
    ],
});

/**
 * Main Logger Class
 * Provides a fluent interface for logging with context
 */
class Logger {
    private context: LogContext = {};

    /**
     * Create a child logger with additional context
     */
    public child(additionalContext: LogContext): Logger {
        const child = new Logger();
        child.context = { ...this.context, ...additionalContext };
        return child;
    }

    /**
     * Update the current context
     */
    public setContext(newContext: LogContext): void {
        this.context = { ...this.context, ...newContext };
    }

    /**
     * Clear the current context
     */
    public clearContext(): void {
        this.context = {};
    }

    /**
     * Log at debug level
     */
    public debug(message: string, metadata?: LogMetadata): void {
        winstonLogger.debug(message, {
            ...this.context,
            metadata: { ...metadata },
        });
    }

    /**
     * Log at info level
     */
    public info(message: string, metadata?: LogMetadata): void {
        winstonLogger.info(message, {
            ...this.context,
            metadata: { ...metadata },
        });
    }

    /**
     * Log at warn level
     */
    public warn(message: string, metadata?: LogMetadata): void {
        winstonLogger.warn(message, {
            ...this.context,
            metadata: { ...metadata },
        });
    }

    /**
     * Log at error level
     */
    public error(message: string, error?: Error | LogMetadata): void {
        const metadata: LogMetadata = {};

        if (error instanceof Error) {
            metadata.message = error.message;
            metadata.name = error.name;
            metadata.stack = error.stack;

            // Include error cause if present
            if (error.cause) {
                metadata.cause = error.cause;
            }

            winstonLogger.error(message, {
                ...this.context,
                metadata,
                stack: error.stack,
            });
        } else {
            winstonLogger.error(message, {
                ...this.context,
                metadata: { ...error },
            });
        }
    }

    /**
     * Log at HTTP level
     */
    public http(message: string, metadata?: LogMetadata): void {
        winstonLogger.http(message, {
            ...this.context,
            metadata: { ...metadata },
        });
    }

    /**
     * Log a structured entry
     */
    public log(entry: LogEntry): void {
        const level = entry.level || LogLevel.INFO;
        const logData = {
            ...entry,
            ...this.context,
        };

        winstonLogger.log(level, entry.message, logData);
    }

    /**
     * Create a performance timer
     * Returns a function that when called, logs the duration
     */
    public startTimer(operation: string): () => void {
        const start = Date.now();
        return () => {
            const duration = Date.now() - start;
            this.debug(`${operation} completed`, { duration: `${duration}ms` });
        };
    }

    /**
     * Log an operation with automatic timing
     */
    public async time<T>(operation: string, fn: () => Promise<T>): Promise<T> {
        const endTimer = this.startTimer(operation);
        try {
            const result = await fn();
            endTimer();
            return result;
        } catch (error) {
            endTimer();
            throw error;
        }
    }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a new logger instance with initial context
 */
export function createLogger(initialContext?: LogContext): Logger {
    const instance = new Logger();
    if (initialContext) {
        instance.setContext(initialContext);
    }
    return instance;
}

/**
 * Get the underlying winston logger for advanced use cases
 */
export function getWinstonLogger(): winston.Logger {
    return winstonLogger;
}

export default logger;
