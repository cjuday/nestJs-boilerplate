import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import ms, {type StringValue } from 'ms';
import { BadRequestException } from '@nestjs/common/exceptions';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

@Injectable()
export class EmailVerificationService {
    constructor(
        private readonly prisma: PrismaService, 
        private readonly configService: ConfigService,
        private readonly realtimeGateway: RealtimeGateway
    ) {}

    generateToken(): string {
        return randomBytes(32).toString('hex');
    }

    private getVerificationExpiresIn(): StringValue {
        return this.configService.get<StringValue>('EMAIL_VERIFICATION_EXPIRES_IN', '15m');
    }

    async create(userId: string) {
        const token = this.generateToken();
        const expiresIn = this.getVerificationExpiresIn();
        const expiresAt = new Date(Date.now() + ms(expiresIn));

        await this.prisma.emailVerification.deleteMany({ where: { userId } });
        return this.prisma.emailVerification.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }

    async findByToken(token: string) {
        return this.prisma.emailVerification.findUnique({ where: { token }, include: { user: true } });
    }

    async verifyEmail(token: string) {
        const verification = await this.findByToken(token);

        if(!verification) {
            throw new BadRequestException('Invalid verification token');
        }

        if(verification.verifiedAt) {
            throw new BadRequestException('Email already verified');
        }

        if(verification.expiresAt < new Date()) {
            throw new BadRequestException('Verification token has expired');
        }

        await this.prisma.$transaction([
            this.prisma.emailVerification.update({
                where: { token },
                data: { verifiedAt: new Date() },
            }),

            this.prisma.user.update({
                where: { id: verification.userId },
                data: { isEmailVerified: true },
            })
        ]);

        this.realtimeGateway.emitToUser(verification.userId, 'email_verified',
            {
                isEmailVerified: true,
                emailVerificationExpiresAt: null,
            },
        );
    }

    async regenerate(userId: string) {
        return this.create(userId);
    }

    async findLatestUnverified(userId: string) {
        return this.prisma.emailVerification.findFirst({
            where: {
                userId,
                verifiedAt: null,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async delete(userId: string): Promise<void> {
        await this.prisma.emailVerification.deleteMany({
            where: { userId }
        });
    }
}
