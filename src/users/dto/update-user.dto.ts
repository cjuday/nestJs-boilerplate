import {
    IsBoolean,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator';

export class UpdateUserDto {
    @IsString()
    name!: string;

    @IsString()
    phoneNumber!: string;

    @IsUUID()
    roleId!: string;

    @IsBoolean()
    isActive!: boolean;

    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;

    @IsOptional()
    @IsString()
    confirmPassword?: string;
}