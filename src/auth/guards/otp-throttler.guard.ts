import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class OtpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const expressReq = req as Request;
    const email = expressReq.body?.email;
    return email ? `otp-${email.toLowerCase()}` : (expressReq.ip ?? 'unknown-ip');
  }
}