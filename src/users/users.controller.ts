import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { UsersService } from './users.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { PayloadType } from '../types/payload.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FavoritesProvider } from './favorites.provider';
import { UpdateUserDto } from './dtos/update-user.dto';

import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
    ApiNotFoundResponse,
    ApiConsumes,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';

import { FileInterceptor } from '@nestjs/platform-express';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { MyProfileResponseDto } from './dtos/profileResponse.dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('/users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly favoritesProvider: FavoritesProvider,
    ) { }

    // ==================== Profile ====================

    @Get('profile')
    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Get current user profile',
    })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully. Request is returned only for sellers who have submitted a request.',
        type: MyProfileResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - valid JWT token is required',
    })
    public getMyProfile(
        @CurrentUser() payload: PayloadType,
    ) {
        return this.usersService.getMyProfile(payload);
    }
    @Get(':id/profile')
    @UseGuards(AuthGuard)
    @ApiParam({
        name: 'id',
        type: String,
        description: 'User ID',
        example: '6a9d616a7346b5d68a4bf239',
    })

    @ApiOperation({
        summary: 'Get another user profile',
    })
    public getAnyUserProfile(
        @Param('id', ParseObjectIdPipe) userId: Types.ObjectId,
    ) {
        return this.usersService.getAnyUserProfile(userId.toString());
    }

    @Patch('profile')
    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Update current user profile',
        description: 'Updates the full name and phone number of the current user.',
    })
    @ApiBody({
        type: UpdateUserDto,
        examples: {
            updateProfile: {
                summary: 'Update profile example',
                value: {
                    fullName: 'John Doe',
                    phoneNumber: '01234567891',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'User profile updated successfully',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - valid JWT token is required',
    })
    public updateMyProfile(
        @CurrentUser() payload: PayloadType,
        @Body() data: UpdateUserDto,
    ) {
        return this.usersService.updateMyProfile(payload.id, data);
    }

    // ==================== Profile Image ====================

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
                    description: 'User profile image',
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

    @Delete('profile-image')
    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Delete current user profile image',
    })
    @ApiResponse({
        status: 200,
        description: 'Profile image deleted successfully',
        schema: {
            example: {
                message: 'Image deleted successfully',
            },
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - valid JWT token is required',
    })
    public async deleteProfileImage(
        @CurrentUser() payload: PayloadType,
    ) {
        return this.usersService.deleteUserImage(payload.id);
    }


    // ==================== Favorites ====================

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
    public getUserFavorites(
        @CurrentUser() payload: PayloadType,
    ) {
        return this.favoritesProvider.getAll(payload.id);
    }

    @Get('favorites/:id')
    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Get a specific favorite',
    })
    @ApiParam({
        name: 'id',
        type: String,
        description: 'Listing ID',
        example: '6a9d616a7346b5d68a4bf239',
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
    public getById(
        @CurrentUser() payload: PayloadType,
        @Param('id', ParseObjectIdPipe) listingId: Types.ObjectId,
    ) {
        return this.favoritesProvider.getOneBy(
            payload.id,
            listingId.toString(),
        );
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
    public clearUserFavorites(
        @CurrentUser() payload: PayloadType,
    ) {
        return this.favoritesProvider.clear(payload.id);
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
    @ApiParam({
        name: 'id',
        type: String,
        description: 'Listing ID',
        example: '6a9d616a7346b5d68a4bf239',
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
        return this.favoritesProvider.toggle(
            payload.id,
            listingId.toString(),
        );
    }
}
