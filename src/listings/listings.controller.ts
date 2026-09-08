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
  Query,
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
import { ListingType, PropertyType } from './listings.model';
import { SearchListingDto } from './dtos/SearchListing.dto';

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
      type: 'object',

      // All DTO fields are required.
      required: [
        'title',
        'description',
        'price',
        'listingType',
        'propertyType',
        'areaSqMeters',
        'bedrooms',
        'bathrooms',
        'amenities',
        'coordinates',
        'address',
        'city',
      ],

      properties: {
        title: {
          type: 'string',
          minLength: 2,
          maxLength: 100,
          example: 'Modern 3-Bedroom Apartment',
          description: 'Title of the property listing.',
        },

        description: {
          type: 'string',
          minLength: 10,
          maxLength: 1000,
          example:
            'Spacious 3-bedroom apartment located in a prime residential area.',
          description: 'Detailed description of the property.',
        },

        price: {
          type: 'number',
          minimum: 0,
          example: 2500000,
          description: 'Price of the property.',
        },

        listingType: {
          type: 'string',
          enum: Object.values(ListingType),
          example: ListingType.SALE,
          description: 'Whether the property is available for sale or rent.',
        },

        propertyType: {
          type: 'string',
          enum: Object.values(PropertyType),
          example: PropertyType.APARTMENT,
          description: 'Type of the property.',
        },

        areaSqMeters: {
          type: 'number',
          minimum: 1,
          example: 150,
          description: 'Property area in square meters.',
        },

        bedrooms: {
          type: 'number',
          minimum: 0,
          example: 3,
          description: 'Number of bedrooms.',
        },

        bathrooms: {
          type: 'number',
          minimum: 1,
          example: 2,
          description: 'Number of bathrooms.',
        },

        amenities: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: ['Parking', 'Swimming Pool', 'Security'],
          description: 'List of amenities available at the property.',
        },

        coordinates: {
          type: 'array',
          items: {
            type: 'number',
          },
          minItems: 2,
          maxItems: 2,
          example: [31.2357, 30.0444],
          description:
            'Geographical coordinates in [longitude, latitude] format.',
        },

        address: {
          type: 'string',
          example: '15 El Tahrir Street',
          description: 'Full address of the property.',
        },

        city: {
          type: 'string',
          example: 'Cairo',
          description: 'City where the property is located.',
        },

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

  @Get()
  @ApiOperation({
    summary: 'Search and retrieve property listings',
    description:
      'Returns approved and available property listings based on the provided filters. All query parameters are optional.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listings retrieved successfully.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            example: 'Modern 3 Bedroom Apartment',
          },
          price: {
            type: 'number',
            example: 3500000,
          },
          listingType: {
            type: 'string',
            example: 'sale',
          },
          propertyType: {
            type: 'string',
            example: 'apartment',
          },
          areaSqMeters: {
            type: 'number',
            example: 180,
          },
          bedrooms: {
            type: 'number',
            example: 3,
          },
          bathrooms: {
            type: 'number',
            example: 2,
          },
          images: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: [
              'https://example.com/image1.jpg',
              'https://example.com/image2.jpg',
            ],
          },
          location: {
            type: 'object',
            properties: {
              city: {
                type: 'string',
                example: 'Nasr City',
              },
              address: {
                type: 'string',
                example: '90th Street, Fifth Settlement',
              },
            },
          },
          isPromoted: {
            type: 'boolean',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-09-08T10:30:00.000Z',
          },
        },
      },
    },
  })
  findAll(@Query() searchDto: SearchListingDto) {
    return this.listingsService.searchListings(searchDto);
  }

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
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: 'Modern 3-Bedroom Apartment',
        },
        description: {
          type: 'string',
          example:
            'Spacious 3-bedroom apartment located in a prime residential area.',
        },
        price: {
          type: 'number',
          example: 220000,
        },
        listingType: {
          type: 'string',
          enum: Object.values(ListingType),
          example: ListingType.SALE,
        },
        propertyType: {
          type: 'string',
          enum: Object.values(PropertyType),
          example: PropertyType.APARTMENT,
        },
        areaSqMeters: {
          type: 'number',
          example: 120,
        },
        bedrooms: {
          type: 'number',
          example: 3,
        },
        bathrooms: {
          type: 'number',
          example: 2,
        },
        amenities: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: ['Parking', 'Security'],
        },
        coordinates: {
          type: 'array',
          items: {
            type: 'number',
          },
          minItems: 2,
          maxItems: 2,
          example: [31.2357, 30.0444],
        },
        address: {
          type: 'string',
          example: '15 El Tahrir Street',
        },
        city: {
          type: 'string',
          example: 'Cairo',
        },
        removedImages: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'URLs of existing images to remove.',
          example: [
            'https://res.cloudinary.com/example/image/upload/apartment-1.jpg',
          ],
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'New images to add to the listing.',
        },
      },
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
