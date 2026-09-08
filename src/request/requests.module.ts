import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { RequestController } from './requests.controller';
import { ListingRequest, ListingRequestSchema } from './requests.model';
import { MongooseModule } from '@nestjs/mongoose';
@Module({
    imports: [CloudinaryModule,
        MongooseModule.forFeature([{ name: ListingRequest.name, schema: ListingRequestSchema }]),

    ],
    providers: [RequestsService],
    controllers: [RequestController],
})

export class RequestModule { }
