import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';
import type { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { CurrentToken } from './decorators/current-token.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { LogoutDto } from './dto/logout.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiUnauthorizedResponse, ApiCreatedResponse, ApiConflictResponse } from '@nestjs/swagger';
import { AuthResponseDto } from './dto/responses/auth-response.dto';
import { RegisterResponseDto } from './dto/responses/register-response.dto';

@ApiTags('Authentication')
@ApiBearerAuth('access-token')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @ApiOperation({
    summary: 'Login',
    description: 'Authenticate a user and return access and refresh tokens.',
  })
  @ApiOkResponse({
    description: 'Login successful.',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password.',
  })
  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  profile(@CurrentUser() user: JwtPayload): JwtPayload {
    return user;
  }

  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate a new access token and refresh token using a valid refresh token.',
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully.',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token.',
  })
  @Public()
  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  refresh(
    @CurrentUser() payload: RefreshTokenPayload,
    @CurrentToken() refreshToken: string,
  ) {
    return this.authService.refresh(payload, refreshToken);
  }

  @Post('logout')
  logout(@CurrentUser() user: JwtPayload, @Body() dto: LogoutDto) {
    return this.authService.logout(user, dto.refreshToken);
  }

  @Post('logout-all')
  async logoutAll(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.authService.logoutAll(user);
  }
}
