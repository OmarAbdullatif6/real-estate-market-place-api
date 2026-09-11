import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequestResponseDto } from '../../request/dtos/RequestResponse.dto';
import { ListingResponseDto } from '../../listings/dtos/listingResponse.dto';
export class MyProfileResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    fullName: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    phoneNumber: string;

    @ApiProperty()
    userImage: string;

    @ApiProperty()
    viewersCount: number;

    @ApiProperty()
    favoritesCount: number;

    @ApiProperty()
    role: string;

    @ApiPropertyOptional({
        description:
            'Seller listing request, returned only if the user is a seller',
        type: RequestResponseDto,
        nullable: true,
    })
    request?: RequestResponseDto | null;

    @ApiPropertyOptional({
        description: 'Seller listings, returned only if the user is a seller',
        type: [ListingResponseDto],
    })
    listings?: ListingResponseDto[];

    @ApiPropertyOptional()
    listingsCount?: number;
}