import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password@123',
    description: 'User password',
  })
  @IsString()
  password!: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Extend the refresh token lifetime.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
