import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionParams } from 'src/sessions/interfaces/create-session-params.interface';
import { UpdateRefreshTokenParams } from './interfaces/update-refresh-token-params.interface';

@Injectable()
export class SessionsService {
    constructor(private readonly prisma: PrismaService) {}
    
    async create(params: CreateSessionParams) {
        const hashedRefreshToken = await bcrypt.hash(params.refreshToken, 10);

        return this.prisma.userSession.create({
            data: {
                userId: params.userId,
                jti: params.jti,
                hashedRefreshToken,
                expiresAt: params.expiresAt,
                rememberMe: params.rememberMe ?? false,
                userAgent: params.userAgent,
                ipAddress: params.ipAddress
            },
        });
    }

    findByJti(jti: string) {
        return this.prisma.userSession.findUnique({ where: { jti } });
    }

    async updateRefreshToken(params: UpdateRefreshTokenParams) {
        const hashedRefreshToken = await bcrypt.hash(params.refreshToken, 10);

        return this.prisma.userSession.update({
            where: {
                id: params.sessionId
            },
            data: {
                jti: params.jti,
                hashedRefreshToken,
                expiresAt: params.expiresAt
            }
        })
    }

    revokeAllForUser(userId: string) {
        return this.prisma.userSession.updateMany({
            where: {
                userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date()
            }
        });
    }
}
