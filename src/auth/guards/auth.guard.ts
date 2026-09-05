import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PayloadType } from '../../types/payload.type';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const req: Request = context.switchToHttp().getRequest();
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (token && type === 'Bearer') {
      try {
        const payload: PayloadType = await this.jwtService.verifyAsync(
          token,
          {
            secret: this.config.get<string>('JWT_SECRET_KEY'),
          },
        );
        req["user"] = payload;
      } catch (error) {
        throw new UnauthorizedException("access denied, invalid token")
      }
    } else throw new UnauthorizedException("access denied, no token provided")

    return true;
  }
}
