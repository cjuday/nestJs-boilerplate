export interface CreateSessionParams {
  userId: string;
  jti: string;
  refreshToken: string;
  expiresAt: Date;
  rememberMe?: boolean;
  userAgent?: string;
  ipAddress?: string;
}
