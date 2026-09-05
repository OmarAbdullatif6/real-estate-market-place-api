import { BadRequestException, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from '../users/users.model';
import { InjectModel } from '@nestjs/mongoose';
import { RegisterDto } from './dtos/register.dto';
import bcrypt from "bcryptjs"
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  public async register(dto: RegisterDto) {
    const { email, password } = dto;
    const existedUser = await this.userModel.findOne({ email });
    if (existedUser) throw new BadRequestException('email already exists');
    const hashedPassword = await this.hashPassword(password);

    const newUser = await this.userModel.create({
        ...dto,
        password:hashedPassword
    });
    return newUser.save()
  }
  
  public async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
}
