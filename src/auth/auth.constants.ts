import { CookieOptions } from 'express';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export function getRefreshCookieOptions(
  configService: ConfigService,
  rememberMe: boolean,
): CookieOptions {
  const expiresIn = configService.getOrThrow<StringValue>(
    rememberMe ? 'JWT_REFRESH_REMEMBER_EXPIRES_IN' : 'JWT_REFRESH_EXPIRES_IN',
  );
  return {
    httpOnly: true,
    secure: configService.get<boolean>('COOKIE_SECURE') ?? false,
    sameSite:
      configService.get<'lax' | 'strict' | 'none'>('COOKIE_SAME_SITE') ?? 'lax',
    path: '/auth/refresh',
    maxAge: ms(expiresIn),
  };
}
