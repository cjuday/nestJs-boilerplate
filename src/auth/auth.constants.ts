import { CookieOptions } from 'express';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';

export function getRefreshCookieOptions(
  configService: ConfigService,
  rememberMe: boolean,
): CookieOptions {
  const expiresIn = configService.getOrThrow<StringValue>(
    rememberMe ? 'JWT_REFRESH_REMEMBER_EXPIRES_IN' : 'JWT_REFRESH_EXPIRES_IN',
  );
  return {
    httpOnly: true,
    secure: configService.get<string>('COOKIE_SECURE') === 'true',
    sameSite:
      (configService.get<string>('COOKIE_SAME_SITE') as
        'lax' | 'strict' | 'none') ?? 'lax',
    path: '/auth/refresh',
    maxAge: ms(expiresIn),
  };
}
