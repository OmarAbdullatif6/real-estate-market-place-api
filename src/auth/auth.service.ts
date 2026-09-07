import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/users.model';
import { InjectModel } from '@nestjs/mongoose';
import { RegisterDto } from './dtos/register.dto';
import bcrypt from 'bcryptjs';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import crypto from 'node:crypto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { OAuth2Client } from 'google-auth-library';
import { UserRole } from '../types/userRole.type';
import { VerifyOtpDto } from './dtos/verify-otp.dto';
import { ResendOtpDto } from './dtos/resend-otp.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  public async googleAuth(idToken: string) {
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
    if (!payload || !payload.email) {
      throw new BadRequestException(
        'Google account must have an email associated',
      );
    }
    const googleId = payload.sub;
    const { email, name, picture } = payload;
    const normalizedEmail = email.toLowerCase().trim();

    let user = await this.userModel.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });
    if (!user) {
      user = await this.userModel.create({
        fullName: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        googleId,
        isVerified: true,
        userImage: picture || null,
      });
    } else {
      let shouldSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        shouldSave = true;
      }
      if (!user.isVerified) {
        user.isVerified = true;
        shouldSave = true;
      }
      if (!user.userImage && picture) {
        user.userImage = picture;
        shouldSave = true;
      }
      if (shouldSave) {
        await user.save();
      }
    }
    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );
    await this.updateRefreshTokenHash(user._id.toString(), tokens.refreshToken);
    return {
      user: this.formatAuthUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  public async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();
    const { password } = registerDto;
    const existedUser = await this.userModel.findOne({ email });
    if (existedUser) throw new BadRequestException('email already exists');

    const hashedPassword = await this.hashPassword(password);
    const otp = this.generateOtp();
    const otpHash = this.hashOtp(otp);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    let newUser;
    try {
      newUser = await this.userModel.create({
        ...registerDto,
        email,
        role: registerDto.userRole as unknown as UserRole,
        password: hashedPassword,
        otpHash,
        otpExpires,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('Phone number is already in use');
      }
      throw error;
    }
    await this.mailService.sendOtpEmail(newUser.email, newUser.fullName, otp);

    return {
      message:
        'Registration successful. Please check your email for the verification code.',
      email: newUser.email,
    };
  }

  public async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const { otp } = dto;
    const incomingOtpHash = this.hashOtp(otp);

    const user = await this.userModel
      .findOne({ email })
      .select('+otpHash +otpExpires');

    if (!user) {
      throw new BadRequestException('Invalid email or verification code');
    }

    if (user.isVerified) {
      return { message: 'Account is already verified. You can log in.' };
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );
    }

    if (user.otpHash !== incomingOtpHash) {
      throw new BadRequestException('Invalid verification code');
    }

    user.isVerified = true;
    user.otpHash = null;
    user.otpExpires = null;
    await user.save();

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );
    await this.updateRefreshTokenHash(user._id.toString(), tokens.refreshToken);

    return {
      message: 'Email verified successfully',
      user: this.formatAuthUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  public async resendOtp(dto: ResendOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userModel.findOne({ email });

    if (!user) {
      return { message: 'If an account exists, a new code has been sent.' };
    }

    if (user.isVerified) {
      throw new BadRequestException('This account is already verified.');
    }

    const otp = this.generateOtp();
    user.otpHash = this.hashOtp(otp);
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await this.mailService.sendOtpEmail(user.email, user.fullName, otp);

    return { message: 'If an account exists, a new code has been sent.' };
  }

  public async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new ForbiddenException({
        statusCode: 403,
        message:
          'Your email is not verified. Please verify your account to continue.',
        isVerified: false,
      });
    }

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );
    await this.updateRefreshTokenHash(user._id.toString(), tokens.refreshToken);

    return {
      user: this.formatAuthUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  public async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET_KEY') ||
      this.configService.get<string>('JWT_SECRET_KEY');

    let payload: { id: string };
    try {
      payload = await this.jwtService.verifyAsync(
        refreshTokenDto.refreshToken,
        {
          secret: refreshSecret,
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userModel
      .findById(payload.id)
      .select('+refreshTokenHash');

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access denied, please log in again');
    }

    const isMatch = await bcrypt.compare(
      refreshTokenDto.refreshToken,
      user.refreshTokenHash,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Access denied, invalid refresh token');
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );
    await this.updateRefreshTokenHash(user._id.toString(), refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  public async logout(userId: string) {
    await this.updateRefreshTokenHash(userId, null);
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.findByEmail(forgotPasswordDto.email);

    if (!user) {
      return {
        message:
          'If an account with that email exists, a reset link has been sent.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await this.setResetPasswordToken(user._id.toString(), tokenHash, expires);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL')?.replace(/\/$/, '') ||
      'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.fullName,
      resetUrl,
    );

    return {
      message:
        'If an account with that email exists, a reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(resetPasswordDto.token)
      .digest('hex');

    const user = await this.findByValidResetToken(tokenHash);
    if (!user) {
      throw new BadRequestException('Reset token is invalid or has expired');
    }

    const hashedPassword = await this.hashPassword(
      resetPasswordDto.newPassword,
    );

    await this.updatePasswordAndClearToken(user._id.toString(), hashedPassword);

    return { message: 'Password has been updated successfully' };
  }

  private async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  private async setResetPasswordToken(
    userId: string,
    tokenHash: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: expires,
    });
  }

  private async findByValidResetToken(
    tokenHash: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { $gt: new Date() },
      })
      .exec();
  }

  private async updatePasswordAndClearToken(
    userId: string,
    newPasswordHash: string,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      password: newPasswordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      refreshTokenHash: null,
    });
  }

  private formatAuthUser(user: any) {
    return {
      id: user._id ? user._id.toString() : user.id,
      name: user.fullName || user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber ?? null,
      userImage: user.userImage ?? null,
      isVerified: user.isVerified ?? false,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  public async generateTokens(
    id: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessSecret = this.configService.get<string>('JWT_SECRET_KEY');
    const accessExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '1d';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET_KEY') || accessSecret;
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { id, email, role },
        { secret: accessSecret, expiresIn: accessExpiresIn as any },
      ),
      this.jwtService.signAsync(
        { id },
        { secret: refreshSecret, expiresIn: refreshExpiresIn as any },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshTokenHash(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    if (!refreshToken) {
      await this.userModel.findByIdAndUpdate(userId, {
        refreshTokenHash: null,
      });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const refreshTokenHash = await bcrypt.hash(refreshToken, salt);
    await this.userModel.findByIdAndUpdate(userId, {
      refreshTokenHash,
    });
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }
}
