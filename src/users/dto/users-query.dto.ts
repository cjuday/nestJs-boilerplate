import { Transform, Type } from 'class-transformer';
import {
    IsIn,
    IsInt,
    IsObject,
    IsOptional,
    IsString,
    Max,
    Min,
    IsArray
} from 'class-validator';

export class UsersQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @IsOptional()
    @Transform(({ value }) => {
        if (!value) {
            return {};
        }

        if (typeof value === 'object') {
            return value;
        }

        try {
            return JSON.parse(value);
        } catch {
            return {};
        }
    })
    @IsObject()
    filters?: Record<string, string>;

    @IsOptional()
    @Transform(({ value }) => {
        if (!value) {
            return [];
        }

        if (Array.isArray(value)) {
            return value;
        }

        try {
            return JSON.parse(value);
        } catch {
            return [];
        }
    })
    @IsArray()
    @IsString({ each: true })
    columns?: string[];
}