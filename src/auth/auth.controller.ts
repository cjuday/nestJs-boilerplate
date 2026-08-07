import { Body, Controller, Get, Post, UseGuards, Res, Query, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';
import type { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { CurrentToken } from './decorators/current-token.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthResponseDto } from './dto/responses/auth-response.dto';
import { RegisterResponseDto } from './dto/responses/register-response.dto';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { getRefreshCookieOptions } from './auth.constants';
import { EmailVerificationService } from 'src/email-verification/email-verification.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from 'src/password-reset/dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Authentication')
@ApiBearerAuth('access-token')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  //Register
  @ApiOperation({
    summary: 'Register a new user',
  })
  @ApiCreatedResponse({
    description: 'User registered successfully.',
    type: RegisterResponseDto,
  })
  @ApiConflictResponse({
    description: 'A user with this email already exists.',
  })
  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  //Login
  @ApiOperation({
    summary: 'Login',
    description:
      'Authenticate a user and return an access token. The refresh token is stored in an HTTP-only cookie.',
  })
  @ApiOkResponse({
    description: 'Login successful.',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password.',
  })
  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, refreshToken, user } =
      await this.authService.login(loginDto);
    const refreshCoookieName = 'refreshToken';
    const rememberMe = loginDto.rememberMe ?? false;

    res.cookie(
      refreshCoookieName,
      refreshToken,
      getRefreshCookieOptions(this.configService, rememberMe),
    );

    return { accessToken, user };
  }

  //Get Current User
  @Get('profile')
  profile(@CurrentUser() user: JwtPayload): JwtPayload {
    return user;
  }

  //Refresh Token
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Generate a new access token and refresh token using a valid refresh token.',
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully.',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token.',
  })
  @Post('refresh')
  @Public()
  @UseGuards(RefreshJwtGuard)
  async refresh(
    @CurrentUser() payload: RefreshTokenPayload,
    @CurrentToken() refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const {
      accessToken,
      refreshToken: newRefreshToken,
      rememberMe,
      user,
    } = await this.authService.refresh(payload, refreshToken);
    const refreshCoookieName = 'refreshToken';

    res.cookie(
      refreshCoookieName,
      newRefreshToken,
      getRefreshCookieOptions(this.configService, rememberMe),
    );

    return { accessToken, user };
  }

  //Logout
  @Post('logout')
  @UseGuards(RefreshJwtGuard)
  async logout(
    @CurrentUser() payload: RefreshTokenPayload,
    @CurrentToken() refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(payload, refreshToken);
    const refreshCoookieName = 'refreshToken';

    res.clearCookie(
      refreshCoookieName,
      getRefreshCookieOptions(this.configService, false),
    );
  }

  @Post('logout-all')
  async logoutAll(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logoutAll(user);

    const refreshCoookieName = 'refreshToken';

    res.clearCookie(
      refreshCoookieName,
      getRefreshCookieOptions(this.configService, false),
    );
  }

  @Post('verify-email')
  @Public()
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    await this.emailVerificationService.verifyEmail(dto.token);
    return { message: 'Email verified successfully.' };
  }

  @Post('resend-email-verification')
  @UseGuards(JwtAuthGuard)
  async resendEmailVerification(@CurrentUser() user: JwtPayload) {
     const verification = await this.authService.resendEmailVerification(user.sub);

    return {
      message: 'Verification email sent successfully.',
      emailVerificationExpiresAt: verification.expiresAt,
    };
  }

  @Post('forgot-password')
  @Public()
  async forgotPassword(@Body() dto: ForgotPasswordDto) : Promise<{message: string}> {
    await this.authService.forgotPassword(dto.email);

    return { message: "If an account exists, a password reset email has been sent."}
  }

  @Post('reset-password')
  @Public()
  async resetPassword(@Body() dto: ResetPasswordDto) : Promise<{ message: string }> {
    await this.authService.resetPassword(dto.token, dto.password);

    return { message: 'Password reset successfully.' }
  }

  @Patch('change-password')
  async changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto): Promise<{ message: string }> {
    return this.authService.changePassword(user.sub, dto);
  }
}
