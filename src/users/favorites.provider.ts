import { Types } from "mongoose";
import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { ListingsService } from './../listings/listings.service';
@Injectable()
export class FavoritesProvider {
  constructor(
    private readonly usersService: UsersService,
    private readonly listingsService: ListingsService
  ) { }

  /**
* 
* @param userId 
* @param listingId 
* @returns 
*/
  public async toggle(userId: string, listingId: string) {
    const user = await this.usersService.getOneBy(userId);

    const favoriteIndex = user.favorites.findIndex(
      (favorite) => favorite.toString() === listingId,
    );

    // Remove from favorites
    if (favoriteIndex !== -1) {


      user.favorites.splice(favoriteIndex, 1);

      await user.save();
      await user.populate('favorites');

      return {
        message: 'Favorite removed successfully',
        isFavorite: false,
        favorites: user.favorites,
      };
    }

    // Add to favorites
    await this.listingsService.findOneById(listingId);
    user.favorites.push(new Types.ObjectId(listingId));

    await user.save();
    await user.populate('favorites');

    return {
      message: 'Favorite added successfully',
      isFavorite: true,
      favorites: user.favorites,
    };
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
    const favoriteId = user.favorites.find((favorite) => favorite.toString() === listingId);
    if (!favoriteId)
      throw new NotFoundException("Listing not in Favorites"); 
    
    return this.listingsService.findOneById(listingId);

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
      favorites: user.favorites
    };
    user.favorites = [];
    await user.save();
    return {
      message: 'Favorites cleared successfully',
      favorites: user.favorites
    };

  }
}