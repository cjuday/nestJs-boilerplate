import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    example: 'cmf2k7w7n0000xyz123456789',
    description: 'Unique user ID',
  })
  id: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: '2026-07-31T08:15:30.000Z',
    description: 'User creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-07-31T08:15:30.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
