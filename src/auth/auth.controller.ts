import { Controller, Post } from "@nestjs/common";


@Controller("/users/auth")
export class AuthController{

    @Post("/register")
    public register(){
        return 
    }
}