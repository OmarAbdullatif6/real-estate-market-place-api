import { forwardRef, Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UsersModule } from "../users/users.module";


@Module({
    controllers:[AuthController],
    providers:[AuthService],
    imports:[
      forwardRef(()=>UsersModule),

      JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          global: true,
          secret: config.get<string>('JWT_SECRET_KEY'),
          signOptions: { expiresIn: config.get<number>('JWT_EXPIRES_IN') },
        };
      },
    }),]
})
export class AuthModule{}