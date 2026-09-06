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
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  title: string;

  @IsString()
  @Length(10, 1000)
  description: string;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsEnum(ListingType)
  listingType: ListingType;

  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @Type(() => Number)
  @IsNumber()
  areaSqMeters: number;

  @Type(() => Number)
  @IsNumber()
  bedrooms: number;

  @Type(() => Number)
  @IsNumber()
  bathrooms: number;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsArray()
  @IsString({ each: true })
  amenities: string[];

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;
}

class LocationDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates: number[];

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;
}
