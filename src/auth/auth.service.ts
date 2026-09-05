import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from '../users/users.model';
import { InjectModel } from '@nestjs/mongoose';
import { RegisterDto } from './dtos/register.dto';
import bcrypt from 'bcryptjs';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService
  ) {}

  public async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;
    const existedUser = await this.userModel.findOne({ email });
    if (existedUser) throw new BadRequestException('email already exists');

    const hashedPassword = await this.hashPassword(password);

    const newUser = await this.userModel.create({
      ...registerDto,
      password: hashedPassword,
    });
    await newUser.save();
    const token = await this.generateToken(newUser._id.toString(), newUser.email, newUser.role)
    return {user:newUser, token}
  }

  public async login(loginDto:LoginDto){
    const user = await this.userModel.findOne({email:loginDto.email})
    if(!user){
      throw new UnauthorizedException("Invalid email or password")
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = await this.generateToken(user._id.toString(), user.email, user.role);

    return {
      user,
      token
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private async generateToken(id: string, email: string, role:string): Promise<string> {
    const payload = { id, email, role };
    return this.jwtService.signAsync(payload);
  }

}
