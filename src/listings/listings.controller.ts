import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CreateListingDto } from './dtos/createListing.dto';
import type { ReqWithUser } from '../types/reqWithUser.type';
import { ListingsService } from './listings.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthRolesGuard } from '../auth/guards/auth-roles.guard';
import { Roles } from '../auth/decorators/user-role.decorator';
import { UserRole } from '../types/userRole.type';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles(UserRole.SELLER)
  @Post()
  create(@Body() createListingDto: CreateListingDto, @Req() req: ReqWithUser) {
    return this.listingsService.create(createListingDto, req.currentUser.id);
  }
  @Get()
  findAll() {
    return 'This action returns all listings';
  }
}
