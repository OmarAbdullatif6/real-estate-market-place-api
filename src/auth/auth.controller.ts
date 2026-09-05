import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';

@Controller('/users/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('/register')
  public register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  public login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}
