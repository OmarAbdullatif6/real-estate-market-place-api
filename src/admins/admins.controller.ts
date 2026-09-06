import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminsService } from './admins.service';
import { AuthRolesGuard } from '../auth/guards/auth-roles.guard';
import { Roles } from '../auth/decorators/user-role.decorator';
import { UserRole } from '../types/userRole.type';

@ApiTags('Admins')
@ApiBearerAuth('access-token')
@UseGuards(AuthRolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard stats retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - admin role required',
  })
  getDashboardStats() {
    return this.adminsService.getDashboardStats();
  }
}
