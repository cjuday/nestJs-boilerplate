import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { randomUUID } from 'crypto';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { SessionsService } from 'src/sessions/sessions.service';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { TokenService } from './token/token.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshAuthResult } from './interfaces/refresh-auth-result.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly tokenService: TokenService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists!');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    return this.userService.create({
      ...registerDto,
      password: hashedPassword,
    });
  }

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    const jti = randomUUID();

    const rememberMe = loginDto.rememberMe ?? false;

    const refreshExpiresIn = this.tokenService.getRefreshExpiresIn(rememberMe);

    const user = await this.userService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid Credentials!');
    }

    const passwordMatch = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    const expiresAt = this.tokenService.calculateExpiresAt(refreshExpiresIn);

    const tokens = await this.tokenService.generateTokens(
      user,
      jti,
      refreshExpiresIn,
    );

    await this.sessionsService.create({
      userId: user.id,
      jti,
      refreshToken: tokens.refreshToken,
      expiresAt,
      rememberMe: rememberMe,
    });

    return tokens;
  }

  async logout(
    payload: RefreshTokenPayload,
    refreshToken: string,
  ): Promise<void> {
    const session = await this.sessionsService.findByJti(payload.jti);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token!');
    }

    if (session.userId !== payload.sub) {
      throw new UnauthorizedException('Invalid session!');
    }

    if (session.revokedAt) {
      return;
    }

    const valid = await bcrypt.compare(
      refreshToken,
      session.hashedRefreshToken,
    );

    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token!');
    }

    await this.sessionsService.revoke(session.id);
  }

  async refresh(
    payload: RefreshTokenPayload,
    refreshToken: string,
  ): Promise<RefreshAuthResult> {
    const session = await this.sessionsService.findByJti(payload.jti);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token!');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked!');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired!');
    }

    const valid = await bcrypt.compare(
      refreshToken,
      session.hashedRefreshToken,
    );

    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token!');
    }

    const user = await this.userService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid user!');
    }

    const newJti = randomUUID();

    const refreshExpiresIn = this.tokenService.getRefreshExpiresIn(
      session.rememberMe,
    );

    const tokens = await this.tokenService.generateTokens(
      user,
      newJti,
      refreshExpiresIn,
    );

    const expiresAt = this.tokenService.calculateExpiresAt(refreshExpiresIn);

    await this.sessionsService.updateRefreshToken({
      sessionId: session.id,
      refreshToken: tokens.refreshToken,
      jti: newJti,
      expiresAt,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      rememberMe: session.rememberMe,
    };
  }

  async logoutAll(user: JwtPayload): Promise<void> {
    await this.sessionsService.revokeAllForUser(user.sub);
  }
}
