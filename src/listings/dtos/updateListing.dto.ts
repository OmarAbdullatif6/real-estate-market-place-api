import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateListingDto } from './createListing.dto';

import { IsArray, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateListingDto extends PartialType(CreateListingDto) {
  @ApiPropertyOptional({
    example: [
      'https://res.cloudinary.com/example/image/upload/v123/real-estate/listings/apartment-1.jpg',
    ],
    description:
      'URLs of existing listing images to remove. Only images belonging to this listing will be removed.',
    type: [String],
  })
  @Transform(({ value }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (typeof value !== 'string') return value;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(value);
    } catch {
      return value;
    }
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removedImages?: string[];
}
