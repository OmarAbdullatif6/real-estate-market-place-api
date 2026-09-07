import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PayloadType } from '../../types/payload.type';
import { ReqWithUser } from '../../types/reqWithUser.type';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  async canActivate(context: ExecutionContext) {
    const req: ReqWithUser = context.switchToHttp().getRequest();
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (token && type === 'Bearer') {
      try {
        const payload: PayloadType = await this.jwtService.verifyAsync(token);
        req.currentUser = payload;
      } catch (error) {
        console.log(error);
        throw new UnauthorizedException('access denied, invalid token');
      }
    } else throw new UnauthorizedException('access denied, no token provided');

    return true;
  }
}
