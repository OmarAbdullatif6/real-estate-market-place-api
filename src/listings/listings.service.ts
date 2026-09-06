import { Injectable } from '@nestjs/common';
import { Listing, ListingDocument } from './listings.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ListingsService {
  constructor(
    @InjectModel(Listing.name)
    private listingModel: Model<ListingDocument>,
  ) {}
}
