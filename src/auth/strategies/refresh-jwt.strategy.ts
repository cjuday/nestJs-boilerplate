import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RefreshTokenPayload } from '../interfaces/refresh-token-payload.interface';
import { RequestWithCookies } from 'src/common/types/request-with-cookies.type';
@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: RequestWithCookies): string | null =>
          req.cookies.refreshToken ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_REFRESH_SECRET'),
    });
  }

  validate(payload: RefreshTokenPayload): RefreshTokenPayload {
    return payload;
  }
}
