import {
  IsString,
  IsNotEmpty,
  Length,
  IsEmail,
  MaxLength,
} from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(250)
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 100)
  password: string;
}
