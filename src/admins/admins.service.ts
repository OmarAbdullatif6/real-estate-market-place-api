import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/users.model';
import {
  Listing,
  ListingDocument,
  ListingStatus,
} from '../listings/listings.model';
import { UserRole } from '../types/userRole.type';
import { ListingsQueryDto } from './dtos/listings-query.dto';
import { UsersQueryDto } from './dtos/users-query.dto';

@Injectable()
export class AdminsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
  ) {}

  // Dashboard stats
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

  //Listings
  async getAllListings(query: ListingsQueryDto) {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const [data, total] = await Promise.all([
      this.listingModel
        .find(filter)
        .populate('owner', 'fullName email phoneNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.listingModel.countDocuments(filter),
    ]);

    return {
      message: 'Listings retrieved successfully',
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOneListing(id: string) {
    const listing = await this.listingModel
      .findById(id)
      .populate('owner', 'fullName email phoneNumber');

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return {
      message: 'Listing retrieved successfully',
      data: listing,
    };
  }

  async approveListing(id: string, adminId: string) {
    const listing = await this.listingModel.findById(id);

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status === ListingStatus.APPROVED) {
      return {
        message: 'Listing is already approved',
        data: listing,
      };
    }

    const updated = await this.listingModel.findByIdAndUpdate(
      id,
      {
        status: ListingStatus.APPROVED,
        rejectionReason: null,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      { new: true },
    );

    return {
      message: 'Listing approved successfully',
      data: updated,
    };
  }

  async rejectListing(id: string, adminId: string, reason: string) {
    const listing = await this.listingModel.findById(id);

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status === ListingStatus.REJECTED) {
      return {
        message: 'Listing is already rejected',
        data: listing,
      };
    }

    const updated = await this.listingModel.findByIdAndUpdate(
      id,
      {
        status: ListingStatus.REJECTED,
        rejectionReason: reason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      { new: true },
    );

    return {
      message: 'Listing rejected successfully',
      data: updated,
    };
  }

  async removeListing(id: string) {
    const listing = await this.listingModel.findByIdAndDelete(id);

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return {
      message: 'Listing removed successfully',
    };
  }

  //Users
  async getUsers(query: UsersQueryDto) {
    const { page = 1, limit = 10, search, role } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { role: { $ne: UserRole.ADMIN } };

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.userModel.countDocuments(filter),
    ]);

    return {
      message: 'Users retrieved successfully',
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    const user = await this.userModel.findById(id).select('-password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User retrieved successfully',
      data: user,
    };
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User deleted successfully',
    };
  }
}
