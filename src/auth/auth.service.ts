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
import  crypto from 'node:crypto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

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
    } catch (error:any) {
      if (error.code === 11000) {
        throw new ConflictException('Phone number is already in use');
      }
      throw error;
    }
    const token = await this.generateToken(
      newUser._id.toString(),
      newUser.email,
      newUser.role,
    );
    return { user: newUser, token };
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
    const token = await this.generateToken(
      user._id.toString(),
      user.email,
      user.role,
    );

    return {
      user,
      token,
    };
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

    const hashedPassword = await this.hashPassword(resetPasswordDto.newPassword)

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

  private async generateToken(
    id: string,
    email: string,
    role: string,
  ): Promise<string> {
    const payload = { id, email, role };
    return this.jwtService.signAsync(payload);
  }
}
