import { ConflictException, Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { randomUUID } from 'crypto';
import { SessionsService } from 'src/sessions/sessions.service';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { TokenService } from './token/token.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshAuthResult } from './interfaces/refresh-auth-result.interface';
import { LoginResult } from './interfaces/login-results.interface';
import { EmailVerificationService } from 'src/email-verification/email-verification.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async register(registerDto: RegisterDto): Promise<LoginResult> {
    const existingUser = await this.userService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists!');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.userService.create({...registerDto, password: hashedPassword });

    const verificationToken = await this.emailVerificationService.create(user.id);

    await this.mailService.sendVerificationEmail(user.email, user.name, verificationToken.token);

    const jti = randomUUID();

    const rememberMe = false;

    const refreshExpiresIn =
      this.tokenService.getRefreshExpiresIn(rememberMe);

    const tokens = await this.tokenService.generateTokens(
      user,
      jti,
      refreshExpiresIn,
    );

    const expiresAt = this.tokenService.calculateExpiresAt(refreshExpiresIn);

    await this.sessionsService.create({
      userId: user.id,
      jti,
      refreshToken: tokens.refreshToken,
      expiresAt,
      rememberMe,
    });

    return {
      ...tokens,
      rememberMe,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified,
        emailVerificationExpiresAt: verificationToken.expiresAt,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResult> {
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

    const verification = await this.emailVerificationService.findLatestUnverified(user.id);

    return {
      ...tokens,
      rememberMe,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified,
        emailVerificationExpiresAt: verification?.expiresAt ?? null,
      },
    };
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
    
    const verification = await this.emailVerificationService.findLatestUnverified(user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      rememberMe: session.rememberMe,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified,
        emailVerificationExpiresAt: verification?.expiresAt ?? null,
      },
    };
  }

  async logoutAll(user: JwtPayload): Promise<void> {
    await this.sessionsService.revokeAllForUser(user.sub);
  }

  async resendEmailVerification(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified.');
    }

    const verification = await this.emailVerificationService.create(user.id);

    await this.mailService.sendVerificationEmail(user.email, user.name, verification.token);
  }
}
