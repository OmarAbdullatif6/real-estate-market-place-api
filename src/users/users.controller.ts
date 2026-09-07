import { Controller, Delete, Get, Param, UseGuards } from "@nestjs/common";
import { InjectModel, ParseObjectIdPipe } from "@nestjs/mongoose";
import { User } from "./users.model";
import { Model } from "mongoose";
import { UsersService } from './users.service';
import { AuthGuard } from "../auth/guards/auth.guard";
import type { PayloadType } from "../types/payload.type";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { FavoritesProvider } from './favorites.provider';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse, ApiNotFoundResponse, }
    from '@nestjs/swagger';
@ApiTags('Users - Favorites')
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
    public getById(@CurrentUser() payload: PayloadType, @Param('id', ParseObjectIdPipe) listingId: string) {
        return this.favoritesProvider.getOneBy(payload.id, listingId);
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


    
    @Delete('favorites/:id')
    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Remove a listing from favorites',
    })
    @ApiResponse({
        status: 200,
        description: 'Favorite removed successfully',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - valid JWT token is required',
    })
    @ApiNotFoundResponse({
        description: 'Listing not found in favorites',
    })
    public removeListingFromFavorites(@CurrentUser() payload: PayloadType, @Param('id', ParseObjectIdPipe) listingId: string) {
        return this.favoritesProvider.remove(payload.id, listingId);
    }
}