import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PayloadType } from '../../types/payload.type';

export const CurrentUser = createParamDecorator(
  (_data, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    const payload: PayloadType = req['user'];
    return payload;
  },
);
