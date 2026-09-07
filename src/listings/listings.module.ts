import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ListingSchema } from './listings.model';
import { Listing } from './listings.model';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  exports:[ListingsService],
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: Listing.name,
        schema: ListingSchema,
      },
    ]),
    CloudinaryModule,
  ],
  providers: [ListingsService],
  controllers: [ListingsController],
})
export class ListingsModule {}
