import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Model } from "mongoose";
import { ListingRequest, RequestStatus } from "./requests.model";
import { InjectModel } from "@nestjs/mongoose";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { RejectRequestDto } from "./dtos/rejectionReason.dto";

@Injectable()
export class RequestsService {
    constructor(
        @InjectModel(ListingRequest.name) private readonly requestModel: Model<ListingRequest>,
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
                existedRequest.rejectionReason = null;
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
    public async approve(reqId: string) {
        const request = await this.requestModel.findById(reqId);
        if (!request) throw new NotFoundException("No request for this id");
        request.status = RequestStatus.APPROVED;
        return await request.save();
    };
    public async reject(reqId: string, dto: RejectRequestDto) {
        const request = await this.requestModel.findById(reqId);
        if (!request) throw new NotFoundException("No request for this id");
        request.status = RequestStatus.REJECTED;
        request.rejectionReason = dto.message;
        return await request.save();
    };
    public async getAll() {
        return this.requestModel.aggregate([
            {
                $addFields: {
                    statusOrder: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", RequestStatus.PENDING] }, then: 1 },
                                { case: { $eq: ["$status", RequestStatus.APPROVED] }, then: 2 },
                                { case: { $eq: ["$status", RequestStatus.REJECTED] }, then: 3 },
                            ],
                            default: 4,
                        },
                    },
                },
            },
            {
                $sort: {
                    statusOrder: 1,
                    createdAt: 1,
                },
            },
            {
                $project: {
                    statusOrder: 0,
                },
            },
        ]);
    }

    public async cancel(reqId: string, userId: string) {
        const request = await this.requestModel.findById(reqId);
        if (!request) {
            throw new NotFoundException("No request for this id");
        }
        if (request.requester.toString() !== userId) {
            throw new ForbiddenException("Can't cancel this request");
        }
        if (request.status !== RequestStatus.PENDING)
            throw new BadRequestException("Only pending requests can be canceled");

        await request.deleteOne();
        return {
            message: "Request canceled successfully"
        }
    };
    public async getUserRequest(userId: string) {
        const request = await this.checkIfUserHaveRequest(userId);
        if (!request) throw new NotFoundException("No request for this user");
        return request;
    }
    public checkIfUserHaveRequest(userId: string) {
        return this.requestModel.findOne({ requester: userId });
    }
}