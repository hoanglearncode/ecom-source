
export interface RegisterResponse {
    user: {
        id: string;
        email: string;
        username?: string;
        phone?: string;
        isVerified: boolean;
        createdAt: string;
    };
    message: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
