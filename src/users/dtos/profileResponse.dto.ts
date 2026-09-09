import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RequestResponseDto } from "../../request/dtos/RequestResponse.dto";

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

    @ApiPropertyOptional({
        description: 'Seller listing request, returned only if the user is a seller and has a request',
        type: RequestResponseDto,
    })
    request?: RequestResponseDto;
}