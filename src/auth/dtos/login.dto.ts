import {
  IsString,
  IsNotEmpty,
  Length,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user',
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(250)
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd123',
    description: 'The user password (min 6 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 100)
  password: string;
}

