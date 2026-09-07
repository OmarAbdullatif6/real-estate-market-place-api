import { Request } from 'express';
import { PayloadType } from './payload.type';

export interface ReqWithUser extends Request {
  currentUser: PayloadType;
}
