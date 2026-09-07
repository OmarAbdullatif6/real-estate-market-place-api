import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminsService } from './admins.service';
import { AuthRolesGuard } from '../auth/guards/auth-roles.guard';
import { Roles } from '../auth/decorators/user-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../types/userRole.type';
import type { PayloadType } from '../types/payload.type';
import { ParseObjectIdPipe } from '../pipes/validateId.pipe';
import { ListingsQueryDto } from './dtos/listings-query.dto';
import { UsersQueryDto } from './dtos/users-query.dto';
import { RejectListingDto } from './dtos/reject-listing.dto';

@ApiBearerAuth('access-token')
@UseGuards(AuthRolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get('dashboard')
  @ApiTags('Admin - Dashboard')
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

  @Get('listings')
  @ApiTags('Admin - Listings')
  @ApiOperation({ summary: 'Get all listings with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'approved', 'rejected'],
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Listings retrieved successfully' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - admin role required',
  })
  getAllListings(@Query() query: ListingsQueryDto) {
    return this.adminsService.getAllListings(query);
  }

  @Get('listings/:id')
  @ApiTags('Admin - Listings')
  @ApiOperation({ summary: 'Get a listing by ID' })
  @ApiResponse({ status: 200, description: 'Listing retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - admin role required',
  })
  getOneListing(@Param('id', ParseObjectIdPipe) id: string) {
    return this.adminsService.getOneListing(id);
  }

  @Patch('listings/:id/approve')
  @ApiTags('Admin - Listings')
  @ApiOperation({ summary: 'Approve a listing' })
  @ApiResponse({ status: 200, description: 'Listing approved successfully' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - admin role required',
  })
  approveListing(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: PayloadType,
  ) {
    return this.adminsService.approveListing(id, user.id);
  }

  @Patch('listings/:id/reject')
  @ApiTags('Admin - Listings')
  @ApiOperation({ summary: 'Reject a listing' })
  @ApiResponse({ status: 200, description: 'Listing rejected successfully' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - admin role required',
  })
  rejectListing(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: PayloadType,
    @Body() body: RejectListingDto,
  ) {
    return this.adminsService.rejectListing(id, user.id, body.reason);
  }

  @Delete('listings/:id')
  @ApiTags('Admin - Listings')
  @ApiOperation({ summary: 'Remove a listing' })
  @ApiResponse({ status: 200, description: 'Listing removed successfully' })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - admin role required',
  })
  removeListing(@Param('id', ParseObjectIdPipe) id: string) {
    return this.adminsService.removeListing(id);
  }

  @Get('users')
  @ApiTags('Admin - Users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - admin role required',
  })
  getUsers(@Query() query: UsersQueryDto) {
    return this.adminsService.getUsers(query);
  }

  @Get('users/:id')
  @ApiTags('Admin - Users')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - admin role required',
  })
  getUserById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.adminsService.getUserById(id);
  }

  @Delete('users/:id')
  @ApiTags('Admin - Users')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - admin role required',
  })
  deleteUser(@Param('id', ParseObjectIdPipe) id: string) {
    return this.adminsService.deleteUser(id);
  }
}
