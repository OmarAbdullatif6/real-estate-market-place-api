import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@ApiTags('Auth')
@Controller('/users/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or email already exists',
  })
  @ApiConflictResponse({
    description: 'Phone number is already in use',
  })
  public register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in with JWT token',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email, password, or credentials',
  })
  public login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
  @Post('/forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email link' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'If an account with that email exists, a reset link has been sent.',
    schema: {
      example: {
        message:
          'If an account with that email exists, a reset link has been sent.',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed (e.g. invalid email format)',
  })
  public forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset account password with a valid token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password has been updated successfully',
    schema: {
      example: {
        message: 'Password has been updated successfully',
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Reset token is invalid or has expired, or new password validation failed',
  })
  public resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}

