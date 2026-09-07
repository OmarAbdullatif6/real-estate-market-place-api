import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateListingDto } from './dtos/createListing.dto';
import type { ReqWithUser } from '../types/reqWithUser.type';
import { ListingsService } from './listings.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthRolesGuard } from '../auth/guards/auth-roles.guard';
import { Roles } from '../auth/decorators/user-role.decorator';
import { UserRole } from '../types/userRole.type';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImageFilesPipe } from '../pipes/image-files.pipe';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from 'multer';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @UseInterceptors(FilesInterceptor('images', 10))
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles(UserRole.SELLER)
  @Post()
  create(
    @Body() createListingDto: CreateListingDto,
    @Req() req: ReqWithUser,
    @UploadedFiles(new ImageFilesPipe(false))
    files?: Express.Multer.File[],
  ) {
    return this.listingsService.create(
      createListingDto,
      req.currentUser.id,
      files,
    );
  }

  @Get()
  findAll() {
    return 'This action returns all listings';
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOneById(id);
  }
}
