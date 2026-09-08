import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { PayloadType } from '../../types/payload.type';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../types/userRole.type';
import { ReqWithUser } from '../../types/reqWithUser.type';

@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) { }
  async canActivate(context: ExecutionContext) {
    const roles: UserRole = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) return false;
    const req: ReqWithUser = context.switchToHttp().getRequest();
    const user = req.currentUser;

    if (!user) return false;

    if (roles.includes(user.role)) {
      return true;
    }

    return false;
  }
}
