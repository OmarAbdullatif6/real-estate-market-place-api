import {
    BadRequestException,
    Controller,
    Delete,
    Param,
    Post,
    Body,
    UploadedFile,
    UseInterceptors,
    UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";

import { RequestsService } from "./requests.service";
import type { PayloadType } from "../types/payload.type";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AuthGuard } from "../auth/guards/auth.guard";

@ApiTags("Requests")
@Controller("/requests")
export class RequestsController {
    constructor(
        private readonly requestsService: RequestsService,
    ) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: "Submit a listing verification request",
    })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                identityDocument: {
                    type: "string",
                    format: "binary",
                },
            },
            required: ["identityDocument"],
        },
    })
    @ApiResponse({
        status: 201,
        description: "Verification request submitted successfully.",
    })
    @ApiResponse({
        status: 400,
        description: "Identity document is required.",
    })
    @ApiResponse({
        status: 409,
        description: "User already has a pending or approved request.",
    })
    @UseInterceptors(FileInterceptor("identityDocument"))
    @UseGuards(AuthGuard)

    async createNewRequest(
        @UploadedFile() identityDocument: Express.Multer.File,
        @CurrentUser() payload: PayloadType,
    ) {
        return this.requestsService.create(
            payload.id,
            identityDocument,
        );
    }

    @Delete(":reqId")
    @ApiBearerAuth('access-token')
    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: "Cancel a verification request",
    })
    @ApiParam({
        name: "reqId",
        description: "The ID of the request to cancel",
        example: "66d123456789abcdef123456",
    })
    @ApiResponse({
        status: 200,
        description: "Request canceled successfully.",
    })
    @ApiResponse({
        status: 404,
        description: "Request not found.",
    })
    async cancelRequestFromUser(
        @Param("reqId") reqId: string,
        @CurrentUser() payload: PayloadType,
    ) {
        return this.requestsService.cancel(reqId,payload.id);
    }
}