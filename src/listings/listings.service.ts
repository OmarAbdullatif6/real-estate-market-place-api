import { Injectable } from '@nestjs/common';
import { Listing } from './listings.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateListingDto } from './dtos/createListing.dto';

@Injectable()
export class ListingsService {
  constructor(
    @InjectModel(Listing.name)
    private listingModel: Model<Listing>,
  ) {}

  async create(
    createListingDto: CreateListingDto,
    ownerId: string,
  ): Promise<Listing> {
    const createdListing = new this.listingModel({
      ...createListingDto,
      owner: ownerId,
    });
    return createdListing.save();
  }
}
