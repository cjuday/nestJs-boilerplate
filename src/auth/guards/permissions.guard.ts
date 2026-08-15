import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const permission = this.reflector.get(
            PERMISSIONS_KEY,
            context.getHandler(),
        );

        if (!permission) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user?.sub) {
            return false;
        }

        const rolePermission = await this.prisma.rolePermission.findFirst({
            where: {
                role: {
                    users: {
                        some: {
                            id: user.sub,
                        },
                    },
                },
                permission: {
                    resource: permission.resource,
                    action: permission.action,
                },
            },
        });

        return !!rolePermission;
    }
}