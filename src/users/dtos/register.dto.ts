import { IsString, IsNotEmpty, IsEmail, IsStrongPassword, IsInt, Min, Max, Matches, IsEnum, Length } from "class-validator";
import { UserRole } from "../../types/userRole.type ";
import { Transform } from "class-transformer";
export enum RegisterUserRole {
    BUYER = 'buyer',
    SELLER = 'seller',
}
export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @Length(3,50)
    @Transform(({ value }) => value?.trim())
    fullName: string;
    
    @Transform(({ value }) => value?.trim())
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    @IsStrongPassword()
    password: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^01[0125][0-9]{8}$/, {
        message: 'Invalid Egyptian phone number'
    }
    )
    phoneNumber: string;

    @IsEnum(RegisterUserRole)
    @IsNotEmpty()
    userRole: RegisterUserRole
}