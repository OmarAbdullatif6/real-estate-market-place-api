import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsStrongPassword,
  IsEnum,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum RegisterUserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
}

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
    minLength: 3,
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 150)
  @Transform(({ value }) => value?.trim())
  fullName: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Unique email address of the user',
  })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value?.trim())
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd123!',
    description: 'Strong password meeting complexity requirements',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    example: '01234567891',
    description: 'Unique phone number of the user',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  phoneNumber: string;

  @ApiProperty({
    enum: RegisterUserRole,
    example: RegisterUserRole.BUYER,
    description: 'Role of the user in the platform',
  })
  @IsEnum(RegisterUserRole)
  @IsNotEmpty()
  userRole: RegisterUserRole;
}