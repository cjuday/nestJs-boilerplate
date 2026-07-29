import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtUser } from '../interfaces/jwt-user.interface';
import { UsersService } from "src/users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService, private readonly usersService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET')
        });
    }

    async validate(payload: JwtUser) {
        const user = await this.usersService.findById(payload.sub);

        if(!user) {
            throw new UnauthorizedException('User not found!');
        }

        return user;
    }
}
