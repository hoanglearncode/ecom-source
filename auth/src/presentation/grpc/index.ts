/**
 * gRPC Presentation Layer
 * Internal service-to-service communication
 *
 * This module exports gRPC service implementations for internal APIs
 * that are called by other microservices via API Gateway or direct gRPC.
 */

import {
    sendUnaryData,
    Server,
    ServerCredentials,
    ServerUnaryCall,
    ServerWritableStream,
} from '@grpc/grpc-js';

// ============================================================
// gRPC Service Definitions (Proto-like interfaces)
// ============================================================

/**
 * AuthService - gRPC service for auth operations
 *
 * Methods:
 * - ValidateToken: Validate JWT token
 * - GetUserInfo: Get user by ID
 * - CheckPermission: Check RBAC permission
 * - GetUserSessions: Get active sessions
 * - RevokeSession: Revoke a session
 */

export interface IAuthServiceServer {
    validateToken: (
        call: ServerUnaryCall<ValidateTokenRequest, ValidateTokenResponse>,
        callback: sendUnaryData<ValidateTokenResponse>,
    ) => void;
    getUserInfo: (
        call: ServerUnaryCall<GetUserInfoRequest, GetUserInfoResponse>,
        callback: sendUnaryData<GetUserInfoResponse>,
    ) => void;
    checkPermission: (
        call: ServerUnaryCall<CheckPermissionRequest, CheckPermissionResponse>,
        callback: sendUnaryData<CheckPermissionResponse>,
    ) => void;
    getUserSessions: (
        call: ServerUnaryCall<GetUserSessionsRequest, GetUserSessionsResponse>,
        callback: sendUnaryData<GetUserSessionsResponse>,
    ) => void;
    revokeSession: (
        call: ServerUnaryCall<RevokeSessionRequest, RevokeSessionResponse>,
        callback: sendUnaryData<RevokeSessionResponse>,
    ) => void;
}

// ============================================================
// Request/Response Types
// ============================================================

export interface ValidateTokenRequest {
    token: string;
}

export interface ValidateTokenResponse {
    valid: boolean;
    user_id?: string;
    role?: string;
    status?: string;
    jti?: string;
}

export interface GetUserInfoRequest {
    user_id: string;
}

export interface GetUserInfoResponse {
    user?: {
        id: string;
        username: string;
        email: string;
        phone: string;
        role: string;
        status: string;
        two_factor_enabled: boolean;
        created_at: string;
    };
    error?: {
        code: string;
        message: string;
    };
}

export interface CheckPermissionRequest {
    user_id: string;
    resource: string;
    action: string;
}

export interface CheckPermissionResponse {
    allowed: boolean;
    role: string;
}

export interface GetUserSessionsRequest {
    user_id: string;
}

export interface Session {
    id: string;
    device_name: string;
    device_type: string;
    ip_address: string;
    last_used_at: string;
    created_at: string;
}

export interface GetUserSessionsResponse {
    sessions: Session[];
}

export interface RevokeSessionRequest {
    session_id: string;
    user_id: string;
}

export interface RevokeSessionResponse {
    success: boolean;
}

// ============================================================
// Service Implementation
// ============================================================

export class AuthServiceServer implements IAuthServiceServer {
    /**
     * Validate JWT token
     */
    validateToken(
        call: ServerUnaryCall<ValidateTokenRequest, ValidateTokenResponse>,
        callback: sendUnaryData<ValidateTokenResponse>,
    ): void {
        // TODO: Implement token validation
        // 1. Verify JWT signature
        // 2. Check if token is blacklisted
        // 3. Extract user info from claims
        // 4. Return ValidateTokenResponse

        const response: ValidateTokenResponse = {
            valid: false,
        };

        callback(null, response);
    }

    /**
     * Get user info by ID
     */
    getUserInfo(
        call: ServerUnaryCall<GetUserInfoRequest, GetUserInfoResponse>,
        callback: sendUnaryData<GetUserInfoResponse>,
    ): void {
        // TODO: Implement get user info
        // 1. Find user by ID
        // 2. Return user data (excluding sensitive fields)
        // 3. Handle not found case

        const response: GetUserInfoResponse = {
            error: {
                code: 'NOT_IMPLEMENTED',
                message: 'Service not yet implemented',
            },
        };

        callback(null, response);
    }

    /**
     * Check user permission
     */
    checkPermission(
        call: ServerUnaryCall<CheckPermissionRequest, CheckPermissionResponse>,
        callback: sendUnaryData<CheckPermissionResponse>,
    ): void {
        // TODO: Implement permission check
        // 1. Get user by ID
        // 2. Check role-based permissions
        // 3. Check specific resource/action permissions
        // 4. Return result

        const response: CheckPermissionResponse = {
            allowed: false,
            role: '',
        };

        callback(null, response);
    }

    /**
     * Get user sessions
     */
    getUserSessions(
        call: ServerUnaryCall<GetUserSessionsRequest, GetUserSessionsResponse>,
        callback: sendUnaryData<GetUserSessionsResponse>,
    ): void {
        // TODO: Implement get user sessions
        // 1. Get user ID from request
        // 2. Fetch all active sessions
        // 3. Return sessions list

        const response: GetUserSessionsResponse = {
            sessions: [],
        };

        callback(null, response);
    }

    /**
     * Revoke a session
     */
    revokeSession(
        call: ServerUnaryCall<RevokeSessionRequest, RevokeSessionResponse>,
        callback: sendUnaryData<RevokeSessionResponse>,
    ): void {
        // TODO: Implement session revocation
        // 1. Get session ID and user ID from request
        // 2. Verify session belongs to user
        // 3. Add token to blacklist
        // 4. Delete session record
        // 5. Return success result

        const response: RevokeSessionResponse = {
            success: false,
        };

        callback(null, response);
    }
}

// ============================================================
// Server Factory
// ============================================================

export interface GrpcServerConfig {
    host: string;
    port: number;
    credentials?: ServerCredentials;
}

export const createGrpcServer = (service: IAuthServiceServer, config: GrpcServerConfig): Server => {
    const server = new Server();

    // TODO: Add service definition once proto files are generated
    // server.addService(authServiceDefinition, service);

    return server;
};

export const startGrpcServer = async (server: Server, config: GrpcServerConfig): Promise<void> => {
    const { host, port, credentials = ServerCredentials.createInsecure() } = config;

    return new Promise((resolve, reject) => {
        server.bindAsync(
            `${host}:${port}`,
            credentials,
            (error: Error | null, bindPort: number) => {
                if (error) {
                    reject(error);
                    return;
                }
                console.log(`gRPC server running on ${host}:${bindPort}`);
                server.start();
                resolve();
            },
        );
    });
};

// ============================================================
// Client Factory (for other services to call this service)
// ============================================================

export class AuthServiceClient {
    private client: any;

    constructor(host: string, port: number) {
        // TODO: Create gRPC client from proto definition
        // this.client = new AuthServiceClientDefinition(`${host}:${port}`, credentials);
    }

    validateToken(
        request: ValidateTokenRequest,
        callback: sendUnaryData<ValidateTokenResponse>,
    ): void {
        // TODO: Implement client call
    }

    getUserInfo(request: GetUserInfoRequest, callback: sendUnaryData<GetUserInfoResponse>): void {
        // TODO: Implement client call
    }

    checkPermission(
        request: CheckPermissionRequest,
        callback: sendUnaryData<CheckPermissionResponse>,
    ): void {
        // TODO: Implement client call
    }
}

// ============================================================
// Export for use in application
// ============================================================

export default AuthServiceServer;
