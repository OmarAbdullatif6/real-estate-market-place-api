import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PayloadType } from '../../types/payload.type';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../types/userRole.type';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const roles: UserRole = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) return false;
    const req: Request = context.switchToHttp().getRequest();
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (token && type === 'Bearer') {
      try {
        const payload: PayloadType = await this.jwtService.verifyAsync(token, {
          secret: this.config.get<string>('JWT_SECRET_KEY'),
        });
        const user = await this.usersService.getOneBy(payload.id);
        if (!user) return false;

        if (roles.includes(user.role)) {
          req['user'] = payload;
          return true;
        }
      } catch (error) {
        throw new UnauthorizedException('access denied, invalid token');
      }
    } else throw new UnauthorizedException('access denied, no token provided');

    return false;
  }
}
