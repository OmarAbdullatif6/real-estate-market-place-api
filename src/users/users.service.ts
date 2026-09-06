import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "./users.model";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private readonly usersModel: Model<User>,
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


}