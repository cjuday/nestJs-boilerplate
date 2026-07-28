import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UsersService, private readonly jwtService: JwtService,) {}

    async register(registerDto : RegisterDto) {
        const existingUser = await this.userService.findByEmail(registerDto.email);

        if(existingUser) {
            throw new ConflictException('Email already exists!');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        return this.userService.create({...registerDto, password: hashedPassword});
    }

    async login(loginDto: LoginDto) {
        const user = await this.userService.findByEmail(loginDto.email);

        if(!user) {
            throw new UnauthorizedException('Invalid Credentials!');
        }

        const passwordMatch = await bcrypt.compare(loginDto.password, user.password);

        if(!passwordMatch) {
            throw new UnauthorizedException('Invalid Credentials');
        }

        const payload = {
            sub: user.id,
            email: user.email,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        return { access_token: accessToken };
    }
}
