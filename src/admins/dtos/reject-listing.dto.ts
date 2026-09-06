import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectListingDto {
  @ApiProperty({
    example: 'Listing photos are not clear',
    description: 'Reason for rejecting the listing',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  reason: string;
}
