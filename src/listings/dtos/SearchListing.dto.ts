import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

import { ListingType, PropertyType } from '../listings.model';

export class SearchListingDto {
  @ApiPropertyOptional({
    example: 30.0444,
    description: 'Latitude of the search location.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    example: 31.2357,
    description: 'Longitude of the search location.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    example: 5,
    minimum: 1,
    description: 'Search radius in kilometers.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  radiusKm?: number;

  @ApiPropertyOptional({
    example: 'Cairo',
    description: 'Filter listings by city.',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    enum: ListingType,
    example: ListingType.SALE,
    description: 'Filter by listing type.',
  })
  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @ApiPropertyOptional({
    enum: PropertyType,
    example: PropertyType.APARTMENT,
    description: 'Filter by property type.',
  })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  // Price
  @ApiPropertyOptional({
    example: 1000000,
    minimum: 0,
    description: 'Minimum property price.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    example: 5000000,
    minimum: 0,
    description: 'Maximum property price.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  // Area
  @ApiPropertyOptional({
    example: 100,
    minimum: 1,
    description: 'Minimum property area in square meters.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minAreaSqMeters?: number;

  @ApiPropertyOptional({
    example: 300,
    minimum: 1,
    description: 'Maximum property area in square meters.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxAreaSqMeters?: number;

  // Bedrooms
  @ApiPropertyOptional({
    example: 2,
    minimum: 0,
    description: 'Number of bedrooms.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  // Bathrooms
  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    description: 'Number of bathrooms.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  bathrooms?: number;
}
