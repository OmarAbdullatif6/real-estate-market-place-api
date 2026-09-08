import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { Model } from "mongoose";
import { ListingRequeust, RequestStatus } from "./requests.model";
import { InjectModel } from "@nestjs/mongoose";
import { CloudinaryService } from "../cloudinary/cloudinary.service";

@Injectable()
export class RequestsService {
    constructor(
        @InjectModel(ListingRequeust.name) private readonly requestModel: Model<ListingRequeust>,
        private readonly cloudinaryService: CloudinaryService,
    ) { }
    public async create(
        requesterId: string,
        identityDocument: Express.Multer.File,
    ) {
        if (!identityDocument) throw new BadRequestException("Identity photo is required");
        const existedRequest = await this.requestModel.findOne({ requester: requesterId });
        if (existedRequest) {
            if (existedRequest.status === RequestStatus.PENDING)
                throw new ConflictException("You already have a pending listing request. It is currently being reviewed.");

            else if (existedRequest.status === RequestStatus.APPROVED)
                throw new ConflictException("Your varification request has already been approved.");

            else if (existedRequest.status === RequestStatus.REJECTED) {
                const uploadedImage = await this.cloudinaryService.uploadImage(identityDocument, 'real-estate/identities');
                existedRequest.status = RequestStatus.PENDING;
                if (existedRequest.identityDocument) {
                    await this.cloudinaryService.deleteFile(existedRequest.identityDocument, 'image');
                }
                existedRequest.identityDocument = uploadedImage.secure_url;
                await existedRequest.save();
                return {
                    message: 'Your verification request has been resubmitted and is now under review.',
                    status: existedRequest.status,
                    identityDocument: existedRequest.identityDocument
                };
            }
        }
        const uploadedImage = await this.cloudinaryService.uploadImage(identityDocument, 'real-estate/identities');
        const newRequest = await this.requestModel.create({
            requester: requesterId,
            status: RequestStatus.PENDING,
            identityDocument: uploadedImage.secure_url
        });
        return {
            message: 'Your verification request has been submitted and is now under review.',
            status: newRequest.status,
            identityDocument: newRequest.identityDocument
        }

    }
}