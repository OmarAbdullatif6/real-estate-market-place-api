import { IsString, IsNotEmpty, IsEmail, IsStrongPassword, IsEnum, Length } from "class-validator";
import { Transform } from "class-transformer";
export enum RegisterUserRole {
    BUYER = 'buyer',
    SELLER = 'seller',
}
export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @Length(3, 150)
    @Transform(({ value }) => value?.trim())
    fullName: string;
    
    @IsNotEmpty()
    @IsEmail()
    @Transform(({ value }) => value?.trim())
    email: string;

    @IsString()
    @IsNotEmpty()
    @IsStrongPassword()
    password: string;

    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @IsEnum(RegisterUserRole)
    @IsNotEmpty()
    userRole: RegisterUserRole
}