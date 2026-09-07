import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { PayloadType } from '../types/payload.type';
import { GoogleAuthDto } from './dtos/google-auth.dto';
import { VerifyOtpDto } from './dtos/verify-otp.dto';
import { ResendOtpDto } from './dtos/resend-otp.dto';
import { Throttle } from '@nestjs/throttler';
import { OtpThrottlerGuard } from './guards/otp-throttler.guard';

@ApiTags('Auth')
@Controller('/users/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully, verification code sent to email',
    schema: {
      example: {
        message:
          'Registration successful. Please check your email for the verification code.',
        email: 'user@example.com',
      },
    },
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

  @Post('/refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully',
    schema: {
      example: {
        token: 'eyJhbGciOi...',
        accessToken: 'eyJhbGciOi...',
        refreshToken: 'eyJhbGciOi...',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid, expired, or revoked refresh token',
  })
  public refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'User logout and refresh token revocation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logged out successfully',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing token',
  })
  public logout(@CurrentUser() user: PayloadType) {
    return this.authService.logout(user.id);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate / Sign in or Sign up with Google OAuth ID token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Google authentication successful, returns user info and JWT tokens',
    schema: {
      example: {
        user: {
          id: '64e8b8f2d592670012345678',
          _id: '64e8b8f2d592670012345678',
          fullName: 'John Doe',
          name: 'John Doe',
          email: 'johndoe@gmail.com',
          role: 'buyer',
        },
        accessToken: 'eyJhbGciOi...',
        refreshToken: 'eyJhbGciOi...',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Google account must have an email associated or invalid payload',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired Google token',
  })
  async googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleAuth(dto.token);
  }

  @UseGuards(OtpThrottlerGuard)
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify account email with a 6-digit OTP' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully, returns user info and JWT tokens',
    schema: {
      example: {
        message: 'Email verified successfully',
        user: {
          id: '64e8b8f2d592670012345678',
          name: 'John Doe',
          email: 'user@example.com',
          role: 'buyer',
          phoneNumber: '01234567891',
          userImage: null,
          isVerified: true,
        },
        accessToken: 'eyJhbGciOi...',
        refreshToken: 'eyJhbGciOi...',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid verification code or code has expired',
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @UseGuards(OtpThrottlerGuard)
  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend verification OTP email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'If an account exists and is unverified, a new code has been sent.',
    schema: {
      example: {
        message: 'If an account exists, a new code has been sent.',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Account is already verified or validation failed',
  })
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }
}

