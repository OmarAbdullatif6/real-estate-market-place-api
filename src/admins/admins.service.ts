import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/users.model';
import {
  Listing,
  ListingDocument,
  ListingStatus,
} from '../listings/listings.model';
import { UserRole } from '../types/userRole.type';

@Injectable()
export class AdminsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
  ) {}

  async getDashboardStats() {
    const now = new Date();

    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const startOfWeek = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - now.getUTCDay(),
      ),
    );

    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );

    const [
      totalUsers,
      totalListings,
      pendingListings,
      activeListings,
      soldListings,
      totalSellers,
      newUsersToday,
      newUsersThisWeek,
      newListingsToday,
      newListingsThisWeek,
      newListingsThisMonth,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: { $ne: UserRole.ADMIN } }),
      this.listingModel.countDocuments(),
      this.listingModel.countDocuments({ status: ListingStatus.PENDING }),
      this.listingModel.countDocuments({
        status: ListingStatus.APPROVED,
        isAvailable: true,
      }),
      this.listingModel.countDocuments({
        status: ListingStatus.APPROVED,
        soldAt: { $ne: null },
      }),
      this.userModel.countDocuments({ role: UserRole.SELLER }),
      this.userModel.countDocuments({
        createdAt: { $gte: startOfToday },
        role: { $ne: UserRole.ADMIN },
      }),
      this.userModel.countDocuments({
        createdAt: { $gte: startOfWeek },
        role: { $ne: UserRole.ADMIN },
      }),
      this.listingModel.countDocuments({ createdAt: { $gte: startOfToday } }),
      this.listingModel.countDocuments({ createdAt: { $gte: startOfWeek } }),
      this.listingModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
    ]);

    return {
      message: 'Dashboard stats retrieved successfully',
      totalUsers,
      totalListings,
      pendingListings,
      activeListings,
      soldListings,
      totalSellers,
      newUsersToday,
      newUsersThisWeek,
      newListingsToday,
      newListingsThisWeek,
      newListingsThisMonth,
    };
  }
}
