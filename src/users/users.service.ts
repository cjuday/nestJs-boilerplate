import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { usersTableConfig } from './users.table';
import ExcelJS from 'exceljs';
import bcrypt from 'bcrypt';

const profileSelect = {
    id: true,
    name: true,
    email: true,
    phoneNumber: true,
    role: {
        select: {
            id: true,
            name: true,
        },
    },
    isEmailVerified: true,
    emailVerification: {
        select: {
            verifiedAt: true,
        },
    },
    isActive: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.UserSelect;

const authProfileSelect = {
    id: true,
    name: true,
    email: true,
    phoneNumber: true,

    role: {
        select: {
            id: true,
            name: true,

            rolePermissions: {
                select: {
                    permission: {
                        select: {
                            resource: true,
                            action: true,
                        },
                    },
                },
            },
        },
    },

    isEmailVerified: true,

    emailVerification: {
        select: {
            verifiedAt: true,
        },
    },

    isActive: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    create(createUserDto: CreateUserDto) {
        return this.prisma.user.create({ data: createUserDto });
    }

    async findAll(query: UsersQueryDto) {
        const {
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10,
            filters = {},
        } = query;

        const skip = (page - 1) * limit;

        const allowedSortFields = [
            'name',
            'email',
            'phoneNumber',
            'role',
            'isEmailVerified',
            'emailVerifiedAt',
            'isActive',
            'createdAt',
        ];

        const safeSortBy = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';

        // Soft-deleted users are still excluded.
        const where: Prisma.UserWhereInput = {
            deletedAt: null,
        };

        /*
         * Search
         */
        if (search) {
            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    email: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    phoneNumber: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        /*
         * Email verification filter
         */
        if (filters.isEmailVerified !== undefined) {
            where.isEmailVerified =
                filters.isEmailVerified === 'true';
        }

        /*
         * Role filter
         */
        if (filters.role !== undefined) {
            where.role = {
                name: String(filters.role),
            };
        }

        /*
         * Activity status filter
         *
         * isActive is independent of deletedAt.
         */
        if (filters.isActive !== undefined) {
            where.isActive =
                filters.isActive === 'true';
        }

        /*
         * Sorting
         */
        let orderBy: Prisma.UserOrderByWithRelationInput;

        switch (safeSortBy) {
            case 'role':
                orderBy = {
                    role: {
                        name: sortOrder,
                    },
                };
                break;

            case 'emailVerifiedAt':
                orderBy = {
                    emailVerification: {
                        verifiedAt: sortOrder,
                    },
                };
                break;

            default:
                orderBy = {
                    [safeSortBy]: sortOrder,
                };
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: profileSelect
            }),

            this.prisma.user.count({
                where,
            }),
        ]);

        const data = users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,

            role: user.role
                ? {
                    id: user.role.id,
                    name: user.role.name,
                }
                : null,

            isEmailVerified: user.isEmailVerified,

            emailVerifiedAt:
                user.emailVerification?.verifiedAt ?? null,

            isActive: user.isActive,

            createdAt: user.createdAt,
        }));

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id,
                deletedAt: null,
            },
            select: profileSelect,
        });

        if (!user) {
            throw new NotFoundException('User not found.');
        }

        return user;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const { name, phoneNumber, roleId, isActive, password, confirmPassword } = updateUserDto;

        const user = await this.prisma.user.findUnique({
            where: {
                id,
                deletedAt: null,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found.');
        }

        if (password && password !== confirmPassword) {
            throw new BadRequestException('Passwords do not match.');
        }

        const data: Prisma.UserUpdateInput = {
            name,
            phoneNumber,
            isActive,
            role: {
                connect: {
                    id: roleId,
                },
            },
        };

        if (password) {
            data.password = await bcrypt.hash(
                password,
                12,
            );
        }

        const updatedUser =
            await this.prisma.user.update({
                where: {
                    id,
                },
                data,
                select: profileSelect,
            });

        return {
            message: 'User updated successfully.',
            user: updatedUser,
        };
    }

    async remove(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id, deletedAt: null },
        });

        if (!user) {
            throw new NotFoundException('User not found.');
        }

        await this.prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });

        return {
            message: 'User deleted successfully.',
        };
    }

    findById(id: string) {
        if (!id) {
            return null;
        }

        return this.prisma.user.findUnique({
            where: { id }
        });
    }

    findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async getProfile(userId: string) {
        const profile = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: authProfileSelect,
        });

        if (!profile) {
            throw new UnauthorizedException('Unauthorized.');
        }

        return {
            ...profile,
            permissions:
                profile.role?.rolePermissions.map(
                    ({ permission }) => permission,
                ) ?? [],
        };
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user) {
            throw new UnauthorizedException('Unauthorized!');
        }

        return this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                name: dto.name,
                phoneNumber: dto.phoneNumber
            },
            select: profileSelect
        });
    }

    async exportUsers(query: UsersQueryDto) {
        const {
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            filters = {},
            columns: requestedColumns = [],
        } = query;

        const allowedSortFields = usersTableConfig.columns
            .filter((column) => column.sortable)
            .map((column) => column.key);

        const safeSortBy = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';

        const exportColumns = usersTableConfig.columns.filter(
            (column) =>
                column.exportable &&
                (
                    requestedColumns.length === 0 ||
                    requestedColumns.includes(column.key)
                ),
        );

        const where: Prisma.UserWhereInput = {
            deletedAt: null,
        };

        /*
         * Search
         */
        if (search) {
            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    email: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    phoneNumber: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        /*
         * Filters
         */
        if (filters.isEmailVerified !== undefined) {
            where.isEmailVerified =
                filters.isEmailVerified === 'true';
        }

        if (filters.role !== undefined) {
            where.role = {
                name: String(filters.role),
            };
        }

        if (filters.isActive !== undefined) {
            where.isActive =
                filters.isActive === 'true';
        }

        /*
         * Sorting
         */
        let orderBy: Prisma.UserOrderByWithRelationInput;

        switch (safeSortBy) {
            case 'role':
                orderBy = {
                    role: {
                        name: sortOrder,
                    },
                };
                break;

            case 'emailVerifiedAt':
                orderBy = {
                    emailVerification: {
                        verifiedAt: sortOrder,
                    },
                };
                break;

            default:
                orderBy = {
                    [safeSortBy]: sortOrder,
                };
        }

        const users = await this.prisma.user.findMany({
            where,
            orderBy,
            select: profileSelect
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Users');

        worksheet.columns = exportColumns.map((column) => ({
            header: column.label,
            key: column.key,
            width: this.getExportColumnWidth(
                column.key,
            ),
        }));

        users.forEach((user) => {
            const row: Record<string, unknown> = {};

            exportColumns.forEach((column) => {
                switch (column.key) {
                    case 'role':
                        row[column.key] =
                            user.role?.name ?? '—';
                        break;

                    case 'isEmailVerified':
                        row[column.key] =
                            user.isEmailVerified
                                ? 'Verified'
                                : 'Not Verified';
                        break;

                    case 'emailVerifiedAt':
                        row[column.key] =
                            user.emailVerification
                                ?.verifiedAt ?? null;
                        break;

                    case 'isActive':
                        row[column.key] =
                            user.isActive
                                ? 'Active'
                                : 'Inactive';
                        break;

                    case 'createdAt':
                        row[column.key] =
                            user.createdAt;
                        break;

                    default:
                        row[column.key] =
                            user[
                            column.key as keyof typeof user
                            ];
                }
            });

            worksheet.addRow(row);
        });

        worksheet.getRow(1).font = {
            bold: true,
        };

        if (
            exportColumns.some(
                (column) =>
                    column.key === 'emailVerifiedAt',
            )
        ) {
            worksheet.getColumn(
                'emailVerifiedAt',
            ).numFmt = 'dd-mmm-yyyy';
        }

        if (
            exportColumns.some(
                (column) => column.key === 'createdAt',
            )
        ) {
            worksheet.getColumn(
                'createdAt',
            ).numFmt = 'dd-mmm-yyyy';
        }

        return workbook.xlsx.writeBuffer();
    }

    private getExportColumnWidth(key: string): number {
        const widths: Record<string, number> = {
            name: 25,
            email: 32,
            phoneNumber: 20,
            role: 20,
            isEmailVerified: 28,
            emailVerifiedAt: 20,
            isActive: 20,
            createdAt: 18,
        };

        return widths[key] ?? 20;
    }

    async findAuthUserById(id: string) {
        return this.prisma.user.findUnique({
            where: {
                id,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                isEmailVerified: true,

                role: {
                    select: {
                        id: true,
                        name: true,

                        rolePermissions: {
                            select: {
                                permission: {
                                    select: {
                                        resource: true,
                                        action: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
}
