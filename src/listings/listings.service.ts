import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Listing, ListingStatus } from './listings.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateListingDto } from './dtos/createListing.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateListingDto } from './dtos/updateListing.dto';
import { SearchListingDto } from './dtos/SearchListing.dto';

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

  async update(
    id: string,
    updateListingDto: UpdateListingDto,
    ownerId: string,
    files?: Express.Multer.File[],
  ): Promise<Listing> {
    const { removedImages, ...otherUpdates } = updateListingDto;
    const { coordinates, address, city, ...updateData } = otherUpdates;

    const hasFieldUpdates = Object.keys(otherUpdates).length > 0;
    const hasImagesToRemove = !!removedImages?.length;
    const hasNewImages = !!files?.length;

    if (!hasFieldUpdates && !hasImagesToRemove && !hasNewImages) {
      throw new BadRequestException(
        'At least one field or image is required to update the listing',
      );
    }

    const listing = await this.listingModel.findOne({
      _id: id,
      owner: ownerId,
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.owner.toString() !== ownerId) {
      throw new ForbiddenException(
        'You do not have permission to update this listing',
      );
    }

    if (removedImages?.length) {
      const imagesToRemove = listing.images.filter((image) =>
        removedImages.includes(image),
      );

      if (imagesToRemove.length !== removedImages.length) {
        throw new BadRequestException(
          'Some images to remove do not belong to this listing',
        );
      }
      if (imagesToRemove.length) {
        await Promise.all(
          imagesToRemove.map(async (image) => {
            const result = await this.cloudinaryService.deleteFileAuto(image);
            if (result.result === 'not found') {
              console.warn(`Image not found in Cloudinary: ${image}`);
            }
            return result;
          }),
        );

        listing.images = listing.images.filter(
          (image) => !imagesToRemove.includes(image),
        );
      }
    }

    if (files?.length) {
      try {
        const uploadedImages = await this.cloudinaryService.uploadImages(
          files,
          'real-estate/listings',
        );

        const newImageUrls = uploadedImages.map((image) => image.secure_url);

        listing.images.push(...newImageUrls);
      } catch (error) {
        throw new InternalServerErrorException(
          error instanceof Error ? error.message : 'Failed to upload images',
        );
      }
    }

    Object.assign(listing, updateData);

    if (coordinates || address || city) {
      listing.location = {
        type: 'Point',
        coordinates: coordinates ?? listing.location.coordinates,
        address: address ?? listing.location.address,
        city: city ?? listing.location.city,
      };
    }

    if (listing.status !== ListingStatus.PENDING) {
      listing.status = ListingStatus.PENDING;
      listing.reviewedBy = null;
      listing.reviewedAt = null;
      listing.rejectionReason = null;
    }

    return listing.save();
  }

  async searchListings(searchDto: SearchListingDto) {
    const {
      city,
      listingType,
      propertyType,
      minPrice,
      maxPrice,
      minAreaSqMeters,
      maxAreaSqMeters,
      bedrooms,
      bathrooms,
      latitude,
      longitude,
      radiusKm,
    } = searchDto;

    const filter: Record<string, any> = {
      status: ListingStatus.APPROVED,
      isAvailable: true,
    };

    if (city) {
      filter['location.city'] = {
        $regex: city,
        $options: 'i',
      };
    }

    if (listingType) {
      filter.listingType = listingType;
    }

    if (propertyType) {
      filter.propertyType = propertyType;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        filter.price.$gte = minPrice;
      }

      if (maxPrice !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        filter.price.$lte = maxPrice;
      }
    }

    if (minAreaSqMeters !== undefined || maxAreaSqMeters !== undefined) {
      filter.areaSqMeters = {};

      if (minAreaSqMeters !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        filter.areaSqMeters.$gte = minAreaSqMeters;
      }

      if (maxAreaSqMeters !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        filter.areaSqMeters.$lte = maxAreaSqMeters;
      }
    }

    if (bedrooms !== undefined) {
      filter.bedrooms = bedrooms;
    }

    if (bathrooms !== undefined) {
      filter.bathrooms = bathrooms;
    }

    if (latitude !== undefined && longitude !== undefined) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          ...(radiusKm !== undefined && {
            $maxDistance: radiusKm * 1000,
          }),
        },
      };
    }

    return this.listingModel.find(filter).exec();
  }
}
