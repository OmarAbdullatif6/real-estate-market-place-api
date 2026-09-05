import { InjectModel } from "@nestjs/mongoose";
import { User } from "./users.model";
import { Model } from "mongoose";
import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";
@Injectable()
export class FavoritesProvider {
    constructor(
        @InjectModel(User.name) private readonly usersModel: Model<User>,
        private readonly usereService: UsersService

    ) { }

    public async getOnBy(id: string) {
        const user = await this.usersModel.findById(id);
        if (!user) throw new NotFoundException("User not found");
        return user

    }

    public async getFavorites(userId:string) {
        const user = await this.getOnBy(userId);
        return user.favorites
    }
}