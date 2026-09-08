import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
@Module({
    imports:[],
    providers:[RequestsService]
})

export class RequestModule {}
