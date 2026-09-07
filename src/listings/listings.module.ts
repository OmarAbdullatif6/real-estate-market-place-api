import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ListingSchema } from './listings.model';
import { Listing } from './listings.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: Listing.name,
        schema: ListingSchema,
      },
    ]),
  ],
  providers: [ListingsService],
  controllers: [ListingsController],
})
export class ListingsModule {}
