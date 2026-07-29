export interface UpdateRefreshTokenParams {
    sessionId: string;
    refreshToken: string;
    jti: string;
    expiresAt: Date;
}