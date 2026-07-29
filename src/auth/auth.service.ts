import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import ms from 'ms';
import type { StringValue } from 'ms';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { SessionsService } from 'src/sessions/sessions.service';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { TokenUser } from './interfaces/token-user.interface';

@Injectable()
export class AuthService {
    private readonly accessSecret: string;
    private readonly accessExpiresIn: StringValue;
    private readonly refreshSecret: string;
    private readonly refreshExpiresIn: StringValue;
    private readonly refreshRememberExpiresIn: StringValue;

    constructor(
        private readonly userService: UsersService, 
        private readonly jwtService: JwtService, 
        private readonly configService: ConfigService,
        private readonly sessionsService: SessionsService
    ) {
        this.accessSecret               = this.configService.getOrThrow('JWT_ACCESS_SECRET');
        this.accessExpiresIn            = this.configService.getOrThrow('JWT_ACCESS_EXPIRES_IN');
        this.refreshSecret              = this.configService.getOrThrow('JWT_REFRESH_SECRET');
        this.refreshExpiresIn           = this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN');
        this.refreshRememberExpiresIn   = this.configService.getOrThrow('JWT_REFRESH_REMEMBER_EXPIRES_IN');
    }

    async register(registerDto : RegisterDto) {
        const existingUser = await this.userService.findByEmail(registerDto.email);

        if(existingUser) {
            throw new ConflictException('Email already exists!');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        return this.userService.create({...registerDto, password: hashedPassword});
    }

    async login(loginDto: LoginDto) {
        const jti  = randomUUID();

        const refreshExpiresIn = loginDto.rememberMe ? this.refreshRememberExpiresIn : this.refreshExpiresIn;

        const user = await this.userService.findByEmail(loginDto.email);

        if(!user) {
            throw new UnauthorizedException('Invalid Credentials!');
        }

        const passwordMatch = await bcrypt.compare(loginDto.password, user.password);

        if(!passwordMatch) {
            throw new UnauthorizedException('Invalid Credentials');
        }

        const expiresAt = new Date(Date.now() + ms(refreshExpiresIn));

        const tokens = await this.generateTokens(user, jti, refreshExpiresIn);

        await this.sessionsService.create({
            userId: user.id,
            jti,
            refreshToken: tokens.refreshToken,
            expiresAt,
            rememberMe: loginDto.rememberMe,
        });

        return tokens;
    }

    private async generateAccessToken(user: TokenUser) : Promise<string> {
        return this.jwtService.signAsync(
            {
                sub: user.id,
                email: user.email
            },
            {
                secret: this.accessSecret,
                expiresIn: this.accessExpiresIn
            }
        );
    }

    private async generateRefreshToken(user: TokenUser, jti: string, expiresIn: StringValue) : Promise<string> {
        return this.jwtService.signAsync(
            {
                sub: user.id,
                jti
            },
            {
                secret: this.refreshSecret,
                expiresIn: expiresIn
            }
        );
    }

    private async generateTokens(user: TokenUser, jti: string, refreshExpiresIn: StringValue) : Promise<AuthTokens> {
        const [ accessToken, refreshToken ] = await Promise.all([
            this.generateAccessToken(user),
            this.generateRefreshToken(user, jti, refreshExpiresIn)
        ]);

        return { accessToken, refreshToken };
    }
    
    async refresh(payload: RefreshTokenPayload, refreshToken: string): Promise<AuthTokens> {
        const session = await this.sessionsService.findByJti(payload.jti);

        if(!session) {
            throw new UnauthorizedException('Invalid refresh token!');
        }

        if (session.revokedAt) {
            throw new UnauthorizedException('Session has been revoked!');
        }

        if(session.expiresAt < new Date()) {
            throw new UnauthorizedException('Refresh token expired!');
        }

        const valid = await bcrypt.compare(refreshToken, session.hashedRefreshToken);

        if(!valid) {
            throw new UnauthorizedException('Invalid refresh token!');
        }

        const user = await this.userService.findById(payload.sub);

        if(!user) {
            throw new UnauthorizedException('Invalid user!');
        }

        const newJti = randomUUID();

        const refreshExpiresIn = session.rememberMe ? this.refreshRememberExpiresIn : this.refreshExpiresIn;

        const tokens = await this.generateTokens(user, newJti, refreshExpiresIn);

        const expiresAt = new Date(Date.now() + ms(refreshExpiresIn));

        await this.sessionsService.updateRefreshToken({sessionId: session.id, refreshToken:tokens.refreshToken, jti:newJti, expiresAt});

        return tokens;
    }
}
