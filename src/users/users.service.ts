import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "./users.model";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { CloudinaryService } from './../cloudinary/cloudinary.service';

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

    async uploadUserImage(userId: string, file: Express.Multer.File,) {
        const user = await this.getOneBy(userId);
        //in case user have already image
        if (user.userImage) {
            await this.cloudinaryService.deleteFileAuto(user.userImage);
        }
        if(!file) throw new NotFoundException("Image is required")
        try {
            
            const uploadedImage = await this.cloudinaryService.uploadImage(file, 'real-estate/users',);
            user.userImage = uploadedImage.secure_url;
            await user.save()
            return {
                message:"Profile Image uploaded successfully",
                userImage:user.userImage
            }

        } catch (error) {
            console.error('Error uploading profile image to Cloudinary:', error);
            throw new Error('Failed to upload image. Please try again later.');
        }
    }


}