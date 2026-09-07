import { Injectable, NotFoundException } from '@nestjs/common';
import { Listing, ListingStatus } from './listings.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateListingDto } from './dtos/createListing.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ListingsService {
  constructor(
    @InjectModel(Listing.name)
    private listingModel: Model<Listing>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createListingDto: CreateListingDto,
    ownerId: string,
    files?: Express.Multer.File[],
  ): Promise<Listing> {
    let imageUrls: string[] = [];

    if (files?.length) {
      try {
        const uploadedImages = await this.cloudinaryService.uploadImages(
          files,
          'real-estate/listings',
        );

        imageUrls = uploadedImages.map((image) => image.secure_url);
      } catch (error) {
        console.error('Error uploading images to Cloudinary:', error);
        throw new Error('Failed to upload images. Please try again later.');
      }
    }

    const createdListing = new this.listingModel({
      ...createListingDto,
      location: {
        type: 'Point',
        coordinates: createListingDto.coordinates,
        address: createListingDto.address,
        city: createListingDto.city,
      },
      owner: ownerId,
      images: imageUrls,
    });

    return createdListing.save();
  }

  async findOneById(id: string): Promise<Listing> {
    const listing = await this.listingModel.findById(id).exec();
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }
    if (listing.status !== ListingStatus.APPROVED) {
      throw new NotFoundException(`Listing with ID ${id} is not approved`);
    }
    return listing;
  }
}
