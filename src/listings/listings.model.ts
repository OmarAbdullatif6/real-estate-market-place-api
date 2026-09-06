import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ListingDocument = HydratedDocument<Listing>;

export enum ListingType {
  RENT = 'rent',
  SALE = 'sale',
}

export enum ListingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum PropertyType {
  APARTMENT = 'apartment',
  VILLA = 'villa',
  STUDIO = 'studio',
  COMMERCIAL = 'commercial',
}

@Schema({ _id: false })
export class PointLocation {
  @Prop({ type: String, enum: ['Point'], default: 'Point', required: true })
  type: string;

  @Prop({ type: [Number], required: true })
  coordinates: number[];

  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ required: true, trim: true })
  city: string;
}

const PointLocationSchema = SchemaFactory.createForClass(PointLocation);

@Schema({ timestamps: true })
export class Listing {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  owner: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ type: String, enum: ListingType, required: true, index: true })
  listingType: ListingType;

  @Prop({ type: String, enum: PropertyType, required: true })
  propertyType: PropertyType;

  @Prop({ required: true, min: 1 })
  areaSqMeters: number;

  @Prop({ required: true, min: 0, default: 1 })
  bedrooms: number;

  @Prop({ required: true, min: 1, default: 1 })
  bathrooms: number;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: PointLocationSchema, required: true })
  location: PointLocation;

  @Prop({ type: Number, min: 0, default: 0 })
  viewingCount: number;

  @Prop({ type: Number, min: 0, default: 0 })
  favouritesCount: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: null })
  soldAt: Date;

  // Moderation state
  @Prop({
    type: String,
    enum: ListingStatus,
    default: ListingStatus.PENDING,
    index: true,
  })
  status: ListingStatus;

  @Prop({ type: String, default: null, trim: true })
  rejectionReason: string | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  reviewedBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt: Date | null;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ default: false, index: true })
  isPromoted: boolean;

  @Prop({ type: Date, default: null })
  promotedUntil: Date | null;
}

export const ListingSchema = SchemaFactory.createForClass(Listing);

ListingSchema.index({ location: '2dsphere' });

ListingSchema.index({
  location: '2dsphere',
  status: 1,
  isAvailable: 1,
  listingType: 1,
  isPromoted: -1,
});
