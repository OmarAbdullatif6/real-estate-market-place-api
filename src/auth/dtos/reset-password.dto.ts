import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'd41d8cd98f00b204e9800998ecf8427e02d8479a3219ef89569b9b008d66046e',
    description: 'The raw password reset token received via email',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  token: string;

  @ApiProperty({
    example: 'P@ssw0rd123!',
    description: 'The new strong password for the account',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  newPassword: string;
}
