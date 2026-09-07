import {
  BadRequestException,
  ConflictException,
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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  public async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;
    const existedUser = await this.userModel.findOne({ email });
    if (existedUser) throw new BadRequestException('email already exists');

    const hashedPassword = await this.hashPassword(password);
    let newUser;
    try {
      newUser = await this.userModel.create({
        ...registerDto,
        password: hashedPassword,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('Phone number is already in use');
      }
      throw error;
    }
    const { accessToken, refreshToken } = await this.generateTokens(
      newUser._id.toString(),
      newUser.email,
      newUser.role,
    );
    await this.updateRefreshTokenHash(newUser._id.toString(), refreshToken);

    return {
      user: newUser,
      accessToken,
      refreshToken,
    };
  }

  public async login(loginDto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: loginDto.email })
      .select('+password');
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const { accessToken, refreshToken } = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );
    await this.updateRefreshTokenHash(user._id.toString(), refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  public async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET_KEY') ||
      this.configService.get<string>('JWT_SECRET_KEY');

    let payload: { id: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
        secret: refreshSecret,
      });
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
        message: 'If an account with that email exists, a reset link has been sent.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await this.setResetPasswordToken(
      user._id.toString(),
      tokenHash,
      expires,
    );

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL')?.replace(/\/$/, '') ||
      'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordResetEmail(user.email, user.fullName, resetUrl);

    return {
      message: 'If an account with that email exists, a reset link has been sent.',
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

    const hashedPassword = await this.hashPassword(resetPasswordDto.newPassword);

    await this.updatePasswordAndClearToken(
      user._id.toString(),
      hashedPassword,
    );

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

  private async findByValidResetToken(tokenHash: string): Promise<UserDocument | null> {
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
    });
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
}
