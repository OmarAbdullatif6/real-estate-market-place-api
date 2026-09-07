import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PayloadType } from '../../types/payload.type';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../types/userRole.type';
import { ReqWithUser } from '../../types/reqWithUser.type';

@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext) {
    const roles: UserRole = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) return false;
    const req: ReqWithUser = context.switchToHttp().getRequest();
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (token && type === 'Bearer') {
      try {
        const payload: PayloadType = await this.jwtService.verifyAsync(token);
        const user = { role: 'seller' }; //dummy till usersService complete
        // const user = await this.usersService.getCurrentUser(payload.id)
        if (!user) return false;

        if (roles.includes(user.role)) {
          req.currentUser = payload;
          return true;
        }
      } catch (error) {
        throw new UnauthorizedException('access denied, invalid token');
      }
    } else throw new UnauthorizedException('access denied, no token provided');

    return false;
  }
}
