import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from 'prisma/config';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
    connectionString: env('DATABASE_URL'),
});

const prisma = new PrismaClient({ adapter });

const firstNames = [
    'John',
    'James',
    'Michael',
    'Robert',
    'David',
    'William',
    'Daniel',
    'Christopher',
    'Matthew',
    'Andrew',
    'Sarah',
    'Emma',
    'Olivia',
    'Sophia',
    'Emily',
    'Hannah',
    'Jessica',
    'Grace',
    'Mia',
    'Charlotte',
];

const lastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Miller',
    'Davis',
    'Wilson',
    'Anderson',
    'Taylor',
    'Thomas',
    'Moore',
    'Jackson',
    'Martin',
    'Lee',
    'Harris',
    'Clark',
    'Lewis',
    'Walker',
    'Hall',
];

function randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function randomPhone(index: number): string {
    return `017${String(10000000 + index).slice(-8)}`;
}

function randomBoolean(): boolean {
    return Math.random() >= 0.5;
}

async function main() {
    /*
     * Roles
     */
    await prisma.role.createMany({
        data: [
            {
                name: 'ADMIN',
                description: 'Full system access',
            },
            {
                name: 'USER',
                description: 'Standard user access',
            },
        ],
        skipDuplicates: true,
    });

    /*
     * Permissions
     */
    await prisma.permission.createMany({
        data: [
            {
                resource: 'users',
                action: 'view',
                description: 'View users',
            },
            {
                resource: 'users',
                action: 'create',
                description: 'Create users',
            },
            {
                resource: 'users',
                action: 'update',
                description: 'Update users',
            },
            {
                resource: 'users',
                action: 'delete',
                description: 'Delete users',
            },
        ],
        skipDuplicates: true,
    });

    /*
     * Roles
     */
    const adminRole = await prisma.role.findUniqueOrThrow({
        where: {
            name: 'ADMIN',
        },
    });

    const userRole = await prisma.role.findUniqueOrThrow({
        where: {
            name: 'USER',
        },
    });

    /*
     * Permissions
     */
    const permissions = await prisma.permission.findMany({
        where: {
            resource: 'users',
        },
    });

    /*
     * ADMIN gets all user permissions
     */
    await prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({
            roleId: adminRole.id,
            permissionId: permission.id,
        })),
        skipDuplicates: true,
    });

    /*
     * USER gets only users.view
     */
    const viewPermission = permissions.find(
        (permission) => permission.action === 'view',
    );

    if (viewPermission) {
        await prisma.rolePermission.createMany({
            data: [
                {
                    roleId: userRole.id,
                    permissionId: viewPermission.id,
                },
            ],
            skipDuplicates: true,
        });
    }

    /*
     * Generate 200 users
     */
    const password = await bcrypt.hash('Password@123', 10);

    const users = Array.from({ length: 200 }, (_, index) => {
        const firstName = randomItem(firstNames);
        const lastName = randomItem(lastNames);

        return {
            name: `${firstName} ${lastName}`,
            email: `testuser${index + 1}@example.com`,
            phoneNumber: randomPhone(index + 1),
            password,
            isEmailVerified: randomBoolean(),
            isPhoneVerified: randomBoolean(),

            // Every 50th user is ADMIN.
            roleId:
                (index + 1) % 50 === 0
                    ? adminRole.id
                    : userRole.id,
        };
    });

    await prisma.user.createMany({
        data: users,
        skipDuplicates: true,
    });

    console.log('Roles and permissions seeded successfully.');
    console.log('200 users seeded successfully.');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });