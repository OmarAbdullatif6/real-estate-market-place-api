import { Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { InjectModel, ParseObjectIdPipe } from "@nestjs/mongoose";
import { User } from "./users.model";
import { Model, Types } from "mongoose";
import { UsersService } from './users.service';
import { AuthGuard } from "../auth/guards/auth.guard";
import type { PayloadType } from "../types/payload.type";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { FavoritesProvider } from './favorites.provider';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiConsumes, ApiBody, }
    from '@nestjs/swagger';
import { FileInterceptor } from "@nestjs/platform-express";
@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller("/users")
export class UsersController {
    constructor(
        @InjectModel(User.name) private readonly usersModel: Model<User>,
        private readonly usersService: UsersService,
        private readonly favoritesProvider: FavoritesProvider
    ) { }
    @Get('favorites')
    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Get current user favorites',
    })
    @ApiResponse({
        status: 200,
        description: 'User favorites retrieved successfully',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - valid JWT token is required',
    })
    public getUserFavorites(@CurrentUser() payload: PayloadType) {
        return this.favoritesProvider.getAll(payload.id)
    }


    @Get('favorites/:id')
    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Get a specific favorite',
    })
    @ApiResponse({
        status: 200,
        description: 'Favorite retrieved successfully',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - valid JWT token is required',
    })
    @ApiNotFoundResponse({
        description: 'Listing not found in favorites',
    })
    public getById(@CurrentUser() payload: PayloadType, @Param('id',ParseObjectIdPipe) listingId: Types.ObjectId) {
        return this.favoritesProvider.getOneBy(payload.id, listingId.toString());
    }

    @Delete('favorites/clear')
    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Clear all user favorites',
    })
    @ApiResponse({
        status: 200,
        description: 'All favorites cleared successfully',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - valid JWT token is required',
    })
    public clearUserFavorites(@CurrentUser() payload: PayloadType) {
        return this.favoritesProvider.clear(payload.id)
    }



    @Patch('favorites/:id')
    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Toggle a listing in favorites',
        description:
            'Adds the listing to favorites if it is not already there, or removes it if it is already in favorites.',
    })
    @ApiResponse({
        status: 200,
        description: 'Listing favorite status toggled successfully',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - valid JWT token is required',
    })
    @ApiNotFoundResponse({
        description:
            'Listing not found, not approved, or the listing is not in favorites when removing',
    })
    public toggleListingFromFavorites(
        @CurrentUser() payload: PayloadType,
        @Param('id', ParseObjectIdPipe) listingId: Types.ObjectId,
    ) {
        return this.favoritesProvider.toggle(payload.id, listingId.toString());
    }

    @Post('profile-image')
    @UseGuards(AuthGuard)
    @UseInterceptors(FileInterceptor('image'))
    @ApiOperation({
        summary: 'Upload or update user profile image',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: {
                    type: 'string',
                    format: 'binary',
                },
            },
            required: ['image'],
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Profile image uploaded successfully',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - valid JWT token is required',
    })
    public async uploadProfileImage(
        @CurrentUser() payload: PayloadType,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.usersService.uploadUserImage(payload.id, file);
    }
}