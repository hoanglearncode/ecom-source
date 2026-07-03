# Logger Module

Hệ thống logging chuyên nghiệp với context awareness, performance tracking, và security event logging.

## Features

- 🎯 **Context Logging**: Log với context (requestId, userId, etc.)
- 🚀 **Performance Tracking**: Theo dõi performance và slow operations
- 🔒 **Security Events**: Logging chuyên biệt cho security events
- 🛠️ **Decorators**: Method decorators cho automatic logging
- 🌐 **Express Middleware**: Request logging middleware
- 📁 **File Rotation**: Automatic log rotation với size limits
- 🎨 **Colorful Output**: Console output với colors (development)
- 📊 **Structured JSON**: JSON format cho production logs

## File Structure

```
logs/
├── app.log              # General application logs
├── error.log            # Error logs only
├── security.log         # Security events (warn+)
├── http.log             # HTTP request logs
├── exceptions.log       # Uncaught exceptions
└── rejections.log       # Unhandled promise rejections
```

## Installation

```bash
# Dependencies đã có trong package.json
# - winston
# - uuid (cho request ID)
```

## Basic Usage

### Simple Logging

```typescript
import { logger } from './shared/logger';

// Basic levels
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
logger.http('HTTP request');

// With metadata
logger.info('User logged in', { userId: '123', email: 'user@example.com' });

// With error
try {
    // ...
} catch (error) {
    logger.error('Operation failed', error);
}
```

### Child Logger with Context

```typescript
// Create child logger with context
const requestLogger = logger.child({
    requestId: 'req-123',
    userId: 'user-456',
    ip: '192.168.1.1',
});

// All logs from this logger include the context
requestLogger.info('Processing request');
// Output: "Processing request | Context: requestId=req-123 userId=user-456 ip=192.168.1.1"
```

### Performance Timing

```typescript
// Manual timing
const endTimer = logger.startTimer('database query');
// ... do work
endTimer(); // Logs: "database query completed | duration: 45ms"

// Async timing
const result = await logger.time('operation', async () => {
    return await someAsyncOperation();
});
```

## Express Middleware

### Request Logging

```typescript
import { requestLoggerMiddleware, errorLoggingMiddleware } from './shared/logger';
import express from 'express';

const app = express();

// Add request logging middleware
app.use(
    requestLoggerMiddleware({
        excludePaths: ['/health', '/readiness'],
        excludeMethods: ['OPTIONS'],
        includeQuery: true,
        includeBody: false,
    }),
);

// Access logger in routes
app.get('/api/users', (req, res) => {
    (req as any).logger.info('Fetching users');
    res.json(users);
});

// Error handling (should be last)
app.use(errorLoggingMiddleware);
```

### Security Event Middleware

```typescript
import { securityEventMiddleware } from './shared/logger';

// Log all authentication attempts
app.post('/api/auth/login', securityEventMiddleware('login_attempt'), loginController);
```

## Security Logger

```typescript
import { securityLogger } from './shared/logger';

// Authentication events
securityLogger.loginSuccess(userId, ip, userAgent);
securityLogger.loginFailed(ip, userAgent, reason, userId);
securityLogger.logout(userId, ip, userAgent);

// Token events
securityLogger.tokenRefresh(userId, ip, userAgent);
securityLogger.tokenInvalid(ip, userAgent, tokenType);
securityLogger.tokenExpired(ip, userAgent, tokenType);

// Password events
securityLogger.passwordChanged(userId, ip, userAgent);
securityLogger.passwordResetRequested(userId, email, ip, userAgent);

// 2FA events
securityLogger.twoFactorEnabled(userId, ip, userAgent);
securityLogger.twoFactorDisabled(userId, ip, userAgent);
securityLogger.twoFactorFailed(userId, ip, userAgent, reason);

// Security alerts
securityLogger.suspiciousActivity('Multiple failed login attempts', userId, ip, userAgent, {
    attempts: 5,
    timeWindow: '5 minutes',
});

securityLogger.rateLimitExceeded(ip, userAgent, endpoint, limit);
securityLogger.unauthorizedAccess(resource, userId, ip, userAgent);
```

## Error Logger

```typescript
import { errorLogger } from './shared/logger';

// Generic error
errorLogger.logError('Operation failed', error, { userId, action });

// Specific error types
errorLogger.databaseError('user.findByEmail', error, query);
errorLogger.validationError('email', email, 'Invalid format', { userId });
errorLogger.externalServiceError('payment-gateway', 'charge', error, { amount });
errorLogger.cacheError('get', key, error);
errorLogger.apiError(url, method, statusCode, responseBody);
```

## Performance Logger

```typescript
import { performanceLogger } from './shared/logger';

// Log slow operations
performanceLogger.slowDatabaseQuery(query, duration, threshold);
performanceLogger.slowApiCall(url, duration, threshold);

// Memory usage
performanceLogger.logMemoryUsage('before optimization');
performanceLogger.logMemoryUsage('after optimization');

// Get statistics
const stats = performanceLogger.getMetricStats('slow_queries');
performanceLogger.logMetricStats('slow_queries');
```

## Decorators

### Method Logging

```typescript
import { LogMethod } from './shared/logger';

class UserService {
    @LogMethod({
        level: LogLevel.DEBUG,
        logArgs: true,
        logResult: false,
        logError: true,
        includeTiming: true,
        customMessage: 'Creating new user',
    })
    async createUser(data: CreateUserDto): Promise<User> {
        // Method will be automatically logged
        return await this.userRepository.create(data);
    }
}
```

### Class Logging

```typescript
import { LogClass } from './shared/logger';

@LogClass({ logArgs: true, includeTiming: true })
class PaymentService {
    // All methods will be automatically logged
    async charge(amount: number): Promise<Charge> {}
    async refund(chargeId: string): Promise<void> {}
    async getBalance(userId: string): Promise<number> {}
}
```

## Circuit Breaker

```typescript
import { CircuitBreaker } from './shared/logger';

const circuitBreaker = new CircuitBreaker('external-api', 5, 60000);

try {
    const result = await circuitBreaker.execute(() => {
        return fetchFromExternalAPI();
    });
} catch (error) {
    // Circuit breaker is OPEN after 5 failures
    logger.error('Service unavailable', { error });
}
```

## Retry with Logging

```typescript
import { withRetry } from './shared/logger';

const result = await withRetry(
    'fetch-user-data',
    () => fetchDataFromAPI(),
    3, // max retries
    1000, // delay between retries
);
```

## Global Error Handlers

```typescript
import { setupGlobalErrorHandlers } from './shared/logger';

// In app initialization
setupGlobalErrorHandlers();

// Now all uncaught errors are logged
```

## Configuration

### Environment Variables

```bash
# Log level (default: info in production, debug in development)
LOG_LEVEL=debug

# Environment
NODE_ENV=development
```

### Log Levels

- `error`: Errors only
- `warn`: Warnings and errors
- `info`: General info (default for production)
- `http`: HTTP requests
- `debug`: Detailed debugging (default for development)

## Examples

### Complete Request Logging Example

```typescript
import { logger, requestLoggerMiddleware, securityLogger } from './shared/logger';
import express from 'express';

const app = express();

// Middleware
app.use(requestLoggerMiddleware());

// Route with security logging
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const requestLogger = (req as any).logger;

    try {
        const user = await authService.authenticate(email, password);

        if (user) {
            securityLogger.loginSuccess(user.id, getClientIp(req), getUserAgent(req));
            res.json({ token: generateToken(user) });
        } else {
            securityLogger.loginFailed(getClientIp(req), getUserAgent(req), 'invalid_credentials');
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        requestLogger.error('Login failed', error);
        res.status(500).json({ error: 'Internal error' });
    }
});
```

### Database Query Logging

```typescript
import { logger, performanceLogger } from './shared/logger';

class UserRepository {
    async findById(id: string) {
        const endTimer = logger.startTimer('user.findById');
        const query = `SELECT * FROM users WHERE id = $1`;

        try {
            const result = await db.query(query, [id]);
            return result.rows[0];
        } finally {
            const duration = endTimer as any;
            performanceLogger.slowDatabaseQuery(query, duration, 1000);
        }
    }
}
```

## Best Practices

1. **Use appropriate log levels**:
    - `debug`: Detailed info for troubleshooting
    - `info`: Normal operations
    - `warn`: Something unexpected but not critical
    - `error`: Errors that need attention

2. **Include context**: Always add relevant context (userId, requestId, etc.)

3. **Don't log sensitive data**:
    - Passwords are automatically redacted
    - Tokens are automatically redacted
    - Be careful with PII

4. **Use structured logging**:
    - Use objects for metadata instead of string concatenation
    - Makes logs searchable and filterable

5. **Monitor performance**:
    - Use performance logging for slow operations
    - Set up alerts for error rates

## License

MIT
