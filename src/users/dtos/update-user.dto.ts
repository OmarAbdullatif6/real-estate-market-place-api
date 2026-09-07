import {
  IsString,
  IsNotEmpty,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
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
    example: '01234567891',
    description: 'Unique phone number of the user',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
