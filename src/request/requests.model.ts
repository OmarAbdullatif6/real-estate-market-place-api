import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema, Types } from 'mongoose';
import { User } from "../users/users.model";
import { Listing } from "../listings/listings.model";
export enum RequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}
@Schema({ timestamps: true })
export class ListingRequest {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: User.name,
        required: true,
        unique:true
    })
    requester: Types.ObjectId;

    @Prop({
        enum: RequestStatus,
        required: true,
        default: RequestStatus.PENDING
    })
    status: RequestStatus;

    @Prop({
        type: String,
        required: true,
        default:null
    })
    rejectionReason: string;

    @Prop({
        type: String,
        required: true,
    })
    identityDocument: string;
}
export const ListingRequestSchema = SchemaFactory.createForClass(ListingRequest);
ListingRequestSchema.index({
    status: 1,
    createdAt: 1,
});