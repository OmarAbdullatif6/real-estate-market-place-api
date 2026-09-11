
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ListingStatus,
  ListingType,
  PropertyType,
} from '../listings.model';

export class ListingOwnerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  userImage: string | null;
}

export class ListingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty({
    enum: ListingType,
  })
  listingType: ListingType;

  @ApiProperty({
    enum: PropertyType,
  })
  propertyType: PropertyType;

  @ApiProperty()
  areaSqMeters: number;

  @ApiProperty()
  bedrooms: number;

  @ApiProperty()
  bathrooms: number;

  @ApiProperty({
    type: [String],
  })
  images: string[];

  @ApiProperty({
    type: [String],
  })
  amenities: string[];

  @ApiProperty()
  location: {
    type: 'Point';
    coordinates: number[];
    address: string;
    city: string;
  };

  @ApiProperty()
  viewingCount: number;

  @ApiProperty()
  favouritesCount: number;

  @ApiProperty({
    enum: ListingStatus,
  })
  status: ListingStatus;

  @ApiPropertyOptional()
  rejectionReason: string | null;

  @ApiPropertyOptional()
  reviewedBy: string | null;

  @ApiPropertyOptional()
  reviewedAt: Date | null;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty()
  isPromoted: boolean;

  @ApiPropertyOptional()
  promotedUntil: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({
    type: ListingOwnerResponseDto,
  })
  owner?: ListingOwnerResponseDto;
}
