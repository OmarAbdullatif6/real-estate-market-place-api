import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { RequestsController } from './requests.controller';
import { ListingRequest, ListingRequestSchema } from './requests.model';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
@Module({
    exports:[RequestsService],
    imports: [AuthModule,CloudinaryModule,
        MongooseModule.forFeature([{ name: ListingRequest.name, schema: ListingRequestSchema }]),

    ],
    providers: [RequestsService],
    controllers: [RequestsController],
})

export class RequestsModule { }
