import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';
import type { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { CurrentToken } from './decorators/current-token.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Public()
    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
    
    @Get('profile')
    profile(@CurrentUser() user: any) {
        return user;
    }

    @Public()
    @UseGuards(RefreshJwtGuard)
    @Post('refresh')
    refresh(@CurrentUser() payload: RefreshTokenPayload, @CurrentToken() refreshToken: string) {
        return this.authService.refresh(payload, refreshToken);
    }
}
