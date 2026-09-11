import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ListingSchema } from './listings.model';
import { Listing } from './listings.model';
import { User, UserSchema } from '../users/users.model';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { GeocodingService } from '../common/services/geocoding.service';

@Module({
  exports: [ListingsService,MongooseModule],
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: Listing.name,
        schema: ListingSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    CloudinaryModule,
  ],
  providers: [ListingsService, GeocodingService],
  controllers: [ListingsController],
})
export class ListingsModule {}
