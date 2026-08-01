import { Body, Controller, Get, Post, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';
import type { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { CurrentToken } from './decorators/current-token.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
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

@ApiTags('Authentication')
@ApiBearerAuth('access-token')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
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
}
