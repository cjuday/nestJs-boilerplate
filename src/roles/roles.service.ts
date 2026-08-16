import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RolesService {
    constructor(private readonly prisma: PrismaService) { }

    findAll() {
        return this.prisma.role.findMany({
            orderBy: {
                'name': 'asc'
            },
            select: {
                id: true,
                name: true,
                description: true
            }
        });
    }
}
