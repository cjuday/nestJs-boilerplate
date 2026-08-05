import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import ms, { StringValue } from 'ms';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PasswordResetService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService
    ) {}

    generateToken() : string {
        return randomBytes(32).toString('hex');
    }

    private getResetExpiresIn(): StringValue {
        return this.configService.get<StringValue>('PASSWORD_RESET_EXPIRES_IN', '10m');
    }

    async create(userId: string) {
        const token = this.generateToken();

        const expiresAt = new Date(Date.now() + ms(this.getResetExpiresIn()));

        await this.delete(userId);

        return this.prisma.passwordReset.create({
            data: {
                userId, token, expiresAt
            }
        });
    }

    findByToken(token: string) {
        return this.prisma.passwordReset.findUnique({
            where: { token },
            include: {
                user: true
            }
        })
    }

    async verifyToken(token: string) {
        const reset = await this.findByToken(token);

        if(!reset) {
            throw new BadRequestException('Invalid password reset token!');
        }

        if(reset.usedAt) {
            throw new BadRequestException('Password reset link has already been used.');
        }

        if(reset.expiresAt < new Date()) {
            throw new BadRequestException('Password reset link has been expired.');
        }

        return reset;
    }

    async delete(userId: string) {
        await this.prisma.passwordReset.deleteMany({
            where: {
                userId, usedAt: null
            }
        });
    }
}
