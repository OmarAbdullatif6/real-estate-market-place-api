import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../types/userRole.type';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
