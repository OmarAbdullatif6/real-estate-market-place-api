import { InjectModel } from "@nestjs/mongoose";
import { User } from "./users.model";
import { Model, Types } from "mongoose";
import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";
@Injectable()
export class FavoritesProvider {
    constructor(
        @InjectModel(User.name) private readonly usersModel: Model<User>,
        private readonly usersService: UsersService
    ) { }






    /**
 * 
 * @param userId 
 * @param listingId 
 * @returns 
 */
    public async add(userId: string, listingId: string) {
        //TODO when listings service well be ready

    }



    /**
     * 
     * @param userId 
     * @returns favorites of user
     */
    public async getAll(userId: string) {
        const user = await this.usersService.getOneBy(userId);
        await user.populate("favorites");
        return user.favorites
    }
    /**
     * 
     * @param userId 
     * @returns favorites of user
     */
    public async getOneBy(userId: string, listingId: string) {
        const user = await this.usersService.getOneBy(userId);
        const favorite = user.favorites.find((favorite) => favorite.toString() === listingId);
        if (!favorite) throw new NotFoundException("Listing not in Favorites")
       //TODO when listings service will be ready

    }



    /**
     * 
     * @param userId 
     * @returns cleared favorite
     */
    public async clear(userId: string) {
    const user = await this.usersService.getOneBy(userId);
    if (user.favorites.length == 0) return {
        message: 'No items in favorites',
    };
    user.favorites = [];
    await user.save();
    return {
        message: 'Favorites cleared successfully',
        favorites: user.favorites
    };

}



    /**
     * 
     * @param userId 
     * @param listingId 
     * @returns favorites after removing listing from favorites
     */
    public async remove(userId: string, listingId: string) {
    const user = await this.usersService.getOneBy(userId);
    const favoriteIndex = user.favorites.findIndex((favorite) => favorite.toString() === listingId);
    if (favoriteIndex === -1) throw new NotFoundException("Listing not in Favorites")
    user.favorites.splice(favoriteIndex, 1);
    await user.save();
    await user.populate("favorites");
    return {
        message: "Favorite removed successfully",
        favorites: user.favorites
    }

}
}