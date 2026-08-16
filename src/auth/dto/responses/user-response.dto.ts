import { ApiProperty } from '@nestjs/swagger';

export class UserRoleDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;
}

export class UserPermissionDto {
    @ApiProperty()
    resource!: string;

    @ApiProperty()
    action!: string;
}

export class UserResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty()
    email!: string;

    @ApiProperty()
    phoneNumber!: string;

    @ApiProperty()
    isEmailVerified!: boolean;

    @ApiProperty({
        nullable: true,
        type: String,
        format: 'date-time',
    })
    emailVerificationExpiresAt!: Date | null;

    @ApiProperty({
        type: UserRoleDto,
        nullable: true,
    })
    role!: UserRoleDto | null;

    @ApiProperty({
        type: [UserPermissionDto],
    })
    permissions!: UserPermissionDto[];
}