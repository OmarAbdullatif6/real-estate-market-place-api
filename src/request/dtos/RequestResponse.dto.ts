import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus } from '../requests.model';

export class RequestResponseDto {
    @ApiProperty({
        description: 'Listing verification request ID',
        example: '66d123456789abcdef123456',
    })
    id: string;

    @ApiProperty({
        enum: RequestStatus,
        example: RequestStatus.PENDING,
    })
    status: RequestStatus;

    @ApiPropertyOptional({
        description: 'Reason for rejection',
        example: 'Identity document is not valid',
        nullable: true,
    })
    rejectionReason?: string | null;

    @ApiProperty({
        description: 'Identity document URL',
        example: 'https://res.cloudinary.com/example/image/upload/document.jpg',
    })
    identityDocument: string;

}