import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface StandardResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((result) => {
        const message = result?.message || 'Success';

        let data = result;
        if (result && typeof result === 'object' && 'message' in result) {
          const { message: _, ...rest } = result;
          data = Object.keys(rest).length > 0 ? rest : null;
        }

        return {
          statusCode,
          success: true,
          message,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}