import { ApiProperty } from '@nestjs/swagger';

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
}
