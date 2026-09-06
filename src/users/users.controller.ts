import { Controller, Delete, Get, Inject, Param, UseGuards } from "@nestjs/common";
import { InjectModel, ParseObjectIdPipe } from "@nestjs/mongoose";
import { User } from "./users.model";
import { Model } from "mongoose";
import { UsersService } from './users.service';
import { AuthGuard } from "../auth/guards/auth.guard";
import type { PayloadType } from "../types/payload.type";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { FavoritesProvider } from './favorites.provider';

@Controller("/users")
export class UsersController {
    constructor(
        @InjectModel(User.name) private readonly usersModel: Model<User>,
        private readonly usersService: UsersService,
        private readonly favoritesProvider: FavoritesProvider
    ) { }
    @Get('favorites')
    @UseGuards(AuthGuard)
    public getUserFavorites(@CurrentUser() payload: PayloadType) {
        return this.favoritesProvider.getAll(payload.id)
    }


    @Get('favorites/:id')
    @UseGuards(AuthGuard)
    public getById(@CurrentUser() payload: PayloadType, @Param('id', ParseObjectIdPipe) listingId: string) {
        return this.favoritesProvider.getOneBy(payload.id, listingId);
    }
    @Delete('favorites/:id')
    @UseGuards(AuthGuard)
    public removeFromListings(@CurrentUser() payload: PayloadType, @Param('id', ParseObjectIdPipe) listingId: string) {
        return this.favoritesProvider.remove(payload.id, listingId);
    }


    @Delete('favorites/clear')
    @UseGuards(AuthGuard)
    public clearUserFavorites(@CurrentUser() payload: PayloadType) {
        return this.favoritesProvider.clear(payload.id)
    }
}