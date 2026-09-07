import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { UsersModule } from '../users/users.module';
import { ListingsModule } from '../listings/listings.module';
import { User, UserSchema } from '../users/users.model';
import { Listing, ListingSchema } from '../listings/listings.model';

@Module({
  controllers: [AdminsController],
  providers: [AdminsService],
  imports: [
    UsersModule,
    ListingsModule,
    JwtModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Listing.name, schema: ListingSchema },
    ]),
  ],
})
export class AdminsModule {}
