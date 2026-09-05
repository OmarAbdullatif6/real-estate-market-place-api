import { Injectable } from "@nestjs/common";
import { User } from "./users.model";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class UsersService {
    constructor(
         @InjectModel(User.name) private readonly usersModel: Model<User>,
    ) { }



}