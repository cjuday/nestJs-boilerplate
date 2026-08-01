import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsPhoneNumber('BD')
  phoneNumber!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
