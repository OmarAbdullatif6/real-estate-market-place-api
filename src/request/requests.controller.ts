import {
    Controller,
    Delete,
    Param,
    Post,
    UploadedFile,
    UseInterceptors,
    UseGuards,
    Get,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ParseObjectIdPipe } from '../pipes/validateId.pipe';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiConflictResponse,
    ApiConsumes,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { RequestsService } from "./requests.service";
import type { PayloadType } from "../types/payload.type";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AuthGuard } from "../auth/guards/auth.guard";
import { AuthRolesGuard } from "../auth/guards/auth-roles.guard";
import { Roles } from "../auth/decorators/user-role.decorator";
import { UserRole } from "../types/userRole.type";
import { Types } from "mongoose";

@ApiTags("Requests")
@ApiBearerAuth('access-token')
@Controller("/requests")
export class RequestsController {
    constructor(
        private readonly requestsService: RequestsService,
    ) { }
    @Get('my-request')
    @UseGuards(AuthGuard, AuthRolesGuard)
    @Roles(UserRole.SELLER)
    @ApiOperation({
        summary: 'Get current seller request',
        description: 'Retrieves the request belonging to the currently authenticated seller.',
    })
    @ApiResponse({
        status: 200,
        description: 'Seller request retrieved successfully.',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - authentication required.',
    })
    @ApiForbiddenResponse({
        description: 'Forbidden - seller role required.',
    })
    @ApiNotFoundResponse({
        description: 'No request found for this seller.',
    })
    async getUserRequest(@CurrentUser() payload: PayloadType) {
        const userId = payload.id;

        return this.requestsService.getUserRequest(userId);
    }



    @Post()
    @UseGuards(AuthGuard, AuthRolesGuard)
    @Roles(UserRole.SELLER)
    @ApiOperation({
        summary: 'Submit a listing verification request',
        description: 'Allows an authenticated seller to submit a listing verification request.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                identityDocument: {
                    type: 'string',
                    format: 'binary',
                },
            },
            required: ['identityDocument'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Verification request submitted successfully.',
    })
    @ApiBadRequestResponse({
        description: 'Identity document is required.',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - authentication required.',
    })
    @ApiForbiddenResponse({
        description: 'Forbidden - seller role required.',
    })
    @ApiConflictResponse({
        description: 'User already has a pending or approved request.',
    })
    @UseInterceptors(FileInterceptor('identityDocument'))
    async createNewRequest(
        @UploadedFile() identityDocument: Express.Multer.File,
        @CurrentUser() payload: PayloadType,
    ) {
        return this.requestsService.create(
            payload.id,
            identityDocument,
        );
    }


    @Delete(':reqId')
    @ApiParam({
        name: 'reqId',
        type: String,
        description: 'The Request ID of the verification request to cancel',
        example: '6a9d616a7346b5d68a4bf239',
    })
    @UseGuards(AuthGuard, AuthRolesGuard)
    @Roles(UserRole.SELLER)
    @ApiOperation({
        summary: 'Cancel a verification request',
        description:
            'Allows an authenticated seller to cancel their own verification request. Only the seller who created the request can cancel it.',
    })
    @ApiResponse({
        status: 200,
        description: 'Request canceled successfully.',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - authentication required.',
    })
    @ApiForbiddenResponse({
        description:
            'Forbidden - seller role required, or the request does not belong to the authenticated seller.',
    })
    @ApiNotFoundResponse({
        description: 'Request not found.',
    })
    async cancelRequestFromUser(
        @Param('reqId', ParseObjectIdPipe) reqId: Types.ObjectId,
        @CurrentUser() payload: PayloadType,
    ) {
        return this.requestsService.cancel(reqId.toString(), payload.id);
    }

}
