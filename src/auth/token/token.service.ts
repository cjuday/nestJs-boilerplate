import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import type { StringValue } from 'ms';
import { TokenUser } from '../interfaces/token-user.interface';
import { AuthTokens } from '../interfaces/auth-tokens.interface';
import { RefreshTokenPayload } from '../interfaces/refresh-token-payload.interface';

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly accessExpiresIn: StringValue;
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: StringValue;
  private readonly refreshRememberExpiresIn: StringValue;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret = this.configService.getOrThrow('JWT_ACCESS_SECRET');
    this.accessExpiresIn = this.configService.getOrThrow(
      'JWT_ACCESS_EXPIRES_IN',
    );
    this.refreshSecret = this.configService.getOrThrow('JWT_REFRESH_SECRET');
    this.refreshExpiresIn = this.configService.getOrThrow(
      'JWT_REFRESH_EXPIRES_IN',
    );
    this.refreshRememberExpiresIn = this.configService.getOrThrow(
      'JWT_REFRESH_REMEMBER_EXPIRES_IN',
    );
  }

  async generateAccessToken(user: TokenUser): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        secret: this.accessSecret,
        expiresIn: this.accessExpiresIn,
      },
    );
  }

  async generateRefreshToken(
    user: TokenUser,
    jti: string,
    expiresIn: StringValue,
  ): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        jti,
      },
      {
        secret: this.refreshSecret,
        expiresIn: expiresIn,
      },
    );
  }

  async generateTokens(
    user: TokenUser,
    jti: string,
    refreshExpiresIn: StringValue,
  ): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user, jti, refreshExpiresIn),
    ]);

    return { accessToken, refreshToken };
  }

  calculateExpiresAt(expiresIn: StringValue): Date {
    return new Date(Date.now() + ms(expiresIn));
  }

  getRefreshExpiresIn(rememberMe: boolean): StringValue {
    return rememberMe ? this.refreshRememberExpiresIn : this.refreshExpiresIn;
  }

  async verifyRefreshToken(refreshToken: string): Promise<RefreshTokenPayload> {
    try {
      return this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token!');
    }
  }
}
