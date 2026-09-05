import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './users.model';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { FavoritesProvider } from './favorites.provider';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  exports: [MongooseModule],

  imports: [
    JwtModule,
    forwardRef(() => AuthModule),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService, FavoritesProvider],
})
export class UsersModule {}