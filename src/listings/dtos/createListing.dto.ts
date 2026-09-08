import { ApiProperty } from '@nestjs/swagger';
import { ListingType, PropertyType } from '../listings.model';

import {
  IsString,
  IsNotEmpty,
  Length,
  IsEnum,
  IsNumber,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';

export class CreateListingDto {
  @ApiProperty({
    example: 'Modern 3-Bedroom Apartment',
    description: 'Title of the property listing.',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  title: string;

  @ApiProperty({
    example:
      'Spacious 3-bedroom apartment located in a prime residential area.',
    description: 'Detailed description of the property.',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @Length(10, 1000)
  description: string;

  @ApiProperty({
    example: 2500000,
    description: 'Price of the property.',
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    enum: ListingType,
    example: ListingType.SALE,
    description: 'Whether the property is available for sale or rent.',
  })
  @IsEnum(ListingType)
  listingType: ListingType;

  @ApiProperty({
    enum: PropertyType,
    example: PropertyType.APARTMENT,
    description: 'Type of the property.',
  })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiProperty({
    example: 150,
    description: 'Property area in square meters.',
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  areaSqMeters: number;

  @ApiProperty({
    example: 3,
    description: 'Number of bedrooms.',
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bedrooms: number;

  @ApiProperty({
    example: 2,
    description: 'Number of bathrooms.',
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  bathrooms: number;

  @ApiProperty({
    example: ['Parking', 'Swimming Pool', 'Security'],
    description: 'List of amenities available at the property.',
    type: [String],
  })
  @Transform(({ value }) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  @IsArray()
  @IsString({ each: true })
  amenities: string[];

  // Location
  @ApiProperty({
    example: [31.2357, 30.0444],
    description: 'Geographical coordinates in [longitude, latitude] format.',
    type: [Number],
    minItems: 2,
    maxItems: 2,
  })
  @Transform(({ value }) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates: number[];

  @ApiProperty({
    example: '15 El Tahrir Street',
    description: 'Full address of the property.',
  })
  @IsString()
  @IsNotEmpty()
  address: string;
}
