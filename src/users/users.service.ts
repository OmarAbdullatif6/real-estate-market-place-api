import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { User } from "./users.model";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { CloudinaryService } from './../cloudinary/cloudinary.service';
import { UpdateUserDto } from "./dtos/update-user.dto";

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private readonly usersModel: Model<User>,
        private readonly cloudinaryService: CloudinaryService,
    ) { }
    /**
      * 
      * @param id 
      * @returns User by id
      */
    public async getOneBy(id: string) {
        const user = await this.usersModel.findById(id);
        if (!user) throw new NotFoundException("User not found");
        return user
    }

    public async uploadUserImage(userId: string, file: Express.Multer.File,) {
        const user = await this.getOneBy(userId);
        //in case user have already image
        if (user.userImage) {
            await this.cloudinaryService.deleteFileAuto(user.userImage);
        }
        if (!file) throw new BadRequestException("Image is required")
        try {

            const uploadedImage = await this.cloudinaryService.uploadImage(file, 'real-estate/users',);
            user.userImage = uploadedImage.secure_url;
            await user.save()
            return {
                message: "Profile Image uploaded successfully",
                userImage: user.userImage
            }

        } catch (error) {
            console.error('Error uploading profile image to Cloudinary:', error);
            throw new InternalServerErrorException('Failed to upload image. Please try again later.');
        }
    }

    public async deleteUserImage(userId: string) {
        const user = await this.getOneBy(userId);
        if (!user.userImage) throw new BadRequestException("User already don't have image")
        user.userImage = null;
        await user.save();
        await this.cloudinaryService.deleteFile(user.userImage, 'image');
        return {
            message: "Image deleted successfully"
        }
    }
    public async getMyProfile(userId: string) {
        const user = await this.getOneBy(userId);
        const { fullName, email, phoneNumber, userImage, viewersCount, id, favorites } = user
        return {
            user: {
                id,
                fullName,
                email,
                viewersCount,
                phoneNumber,
                userImage,
                favoritesCount: favorites.length

            }
        }
    }
    public async updateMyProfile(userId: string, data: UpdateUserDto) {
        const user = await this.getOneBy(userId);
        const { fullName, email, phoneNumber, userImage, viewersCount, id } = user;
        user.fullName = data.fullName ?? user.fullName;
        user.phoneNumber = data.phoneNumber ?? user.phoneNumber;
        await user.save();
        return {
            user: {
                id,
                fullName,
                email,
                viewersCount,
                phoneNumber,
                userImage

            }
        }
    }
    public async incrementViewers(userId: string) {
        const user = await this.getOneBy(userId);
        user.viewersCount++;
        await user.save();
        return { count: user.viewersCount };
    }
}