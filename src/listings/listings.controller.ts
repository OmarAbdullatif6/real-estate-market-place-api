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
  HttpStatus,
  HttpCode,
  Patch,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';

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
import { UpdateListingDto } from './dtos/updateListing.dto';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new property listing',
    description:
      'Creates a new property listing for the authenticated seller. ' +
      'The listing will initially have a pending moderation status. ' +
      'Up to 10 images can optionally be uploaded.',
  })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Property listing data and optional property images.',
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(CreateListingDto),
        },
        {
          type: 'object',
          properties: {
            images: {
              type: 'array',
              items: {
                type: 'string',
                format: 'binary',
              },
              maxItems: 10,
              description: 'Optional property images. Maximum 10 images.',
            },
          },
        },
      ],
    },
  })
  @ApiCreatedResponse({
    description: 'Property listing created successfully.',
    schema: {
      example: {
        _id: '68bd123456789abcdef123456',
        owner: '68bd987654321abcdef123456',
        title: 'Modern 3-Bedroom Apartment',
        description:
          'Spacious 3-bedroom apartment located in a prime residential area.',
        price: 2500000,
        listingType: 'sale',
        propertyType: 'apartment',
        areaSqMeters: 150,
        bedrooms: 3,
        bathrooms: 2,
        images: [
          'https://res.cloudinary.com/example/image/upload/apartment-1.jpg',
          'https://res.cloudinary.com/example/image/upload/apartment-2.jpg',
        ],
        amenities: ['Parking', 'Swimming Pool', 'Security'],
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444],
          address: '15 El Tahrir Street',
          city: 'Cairo',
        },
        viewingCount: 0,
        favouritesCount: 0,
        status: 'pending',
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null,
        isAvailable: true,
        isPromoted: false,
        promotedUntil: null,
        soldAt: null,
        createdAt: '2026-09-07T10:00:00.000Z',
        updatedAt: '2026-09-07T10:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed or one or more uploaded images are invalid.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required or the access token is invalid.',
  })
  @ApiForbiddenResponse({
    description: 'Only users with the SELLER role can create listings.',
  })
  @UseInterceptors(FilesInterceptor('images', 10))
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles(UserRole.SELLER)
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

  // @Get()
  // findAll() {
  //   return 'This action returns all listings';
  // }

  @Get(':id')
  @ApiOperation({
    summary: 'Get an approved listing by ID',
    description:
      'Retrieves a property listing by its unique ID. ' +
      'Only listings with an APPROVED moderation status are accessible through this endpoint.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the property listing',
    example: '68bd123456789abcdef123456',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Approved property listing retrieved successfully.',
    schema: {
      example: {
        _id: '68bd123456789abcdef123456',
        owner: '68bd987654321abcdef123456',
        title: 'Modern 3-Bedroom Apartment',
        description:
          'Spacious 3-bedroom apartment located in a prime residential area.',
        price: 2500000,
        listingType: 'sale',
        propertyType: 'apartment',
        areaSqMeters: 150,
        bedrooms: 3,
        bathrooms: 2,
        images: [
          'https://res.cloudinary.com/example/image/upload/apartment-1.jpg',
          'https://res.cloudinary.com/example/image/upload/apartment-2.jpg',
        ],
        amenities: ['Parking', 'Swimming Pool', 'Security'],
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444],
          address: '15 El Tahrir Street',
          city: 'Cairo',
        },
        viewingCount: 42,
        favouritesCount: 12,
        status: 'approved',
        rejectionReason: null,
        reviewedBy: '68bd987654321abcdef123456',
        reviewedAt: '2026-09-06T15:30:00.000Z',
        isAvailable: true,
        isPromoted: false,
        promotedUntil: null,
        soldAt: null,
        createdAt: '2026-09-05T10:00:00.000Z',
        updatedAt: '2026-09-06T15:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'The provided listing ID is invalid.',
  })
  @ApiNotFoundResponse({
    description:
      'The listing was not found or the listing has not been approved.',
  })
  findOne(@Param('id') id: string) {
    return this.listingsService.findOneById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a property listing',
    description:
      'Updates an existing property listing owned by the authenticated seller. ' +
      'Only provided fields are updated. New images can be uploaded and existing images can be removed.',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the property listing',
    example: '68bd123456789abcdef123456',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(UpdateListingDto),
        },
        {
          type: 'object',
          properties: {
            images: {
              type: 'array',
              description: 'New images to add to the listing.',
              items: {
                type: 'string',
                format: 'binary',
              },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listing updated successfully.',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid listing ID or validation failed for the provided fields.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication is required or the provided access token is invalid.',
  })
  @ApiForbiddenResponse({
    description: 'Only users with the SELLER role can update listings.',
  })
  @ApiNotFoundResponse({
    description:
      'The listing was not found or does not belong to the authenticated seller.',
  })
  @UseInterceptors(FilesInterceptor('images', 10))
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles(UserRole.SELLER)
  update(
    @Param('id') id: string,
    @Body() updateListingDto: UpdateListingDto,
    @Req() req: ReqWithUser,
    @UploadedFiles(new ImageFilesPipe(false))
    files?: Express.Multer.File[],
  ) {
    return this.listingsService.update(
      id,
      updateListingDto,
      req.currentUser.id,
      files,
    );
  }
}
