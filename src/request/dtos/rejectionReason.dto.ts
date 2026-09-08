import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class RejectRequestDto {
  @IsString()
  @IsNotEmpty()
  @Length(10,300)
  message: string;
}