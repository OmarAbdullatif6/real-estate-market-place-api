import { Controller, Get } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./users.model";
import { Model } from "mongoose";

@Controller("/users")
export class UsersController {
    constructor(
        @InjectModel(User.name) private readonly usersModel: Model<User>
    ) { }
    @Get()
    public getAll() {
        return this.usersModel.find()
    }
}