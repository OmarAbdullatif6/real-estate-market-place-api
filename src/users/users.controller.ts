import { Controller, Get, Inject, Param, UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
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
        return this.favoritesProvider.getFavorites(payload.id)
    }
}