import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { UsersModule } from '../users/users.module';
import { ListingsModule } from '../listings/listings.module';
import { User, UserSchema } from '../users/users.model';
import { Listing, ListingSchema } from '../listings/listings.model';
import { RequestsModule } from '../request/requests.module';

@Module({
  controllers: [AdminsController],
  providers: [AdminsService],
  imports: [
    RequestsModule,
    UsersModule,
    ListingsModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Listing.name, schema: ListingSchema },
    ]),
  ],
})
export class AdminsModule {}
