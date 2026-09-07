import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { AuthRolesGuard } from './guards/auth-roles.guard';
import { AuthGuard } from './guards/auth.guard';
import type { StringValue } from 'ms';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, AuthRolesGuard],
  imports: [
    forwardRef(() => UsersModule),
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          global: true,
          secret: config.getOrThrow<string>('JWT_SECRET_KEY'),
          signOptions: {
            expiresIn: config.getOrThrow<string>(
              'JWT_EXPIRES_IN',
            ) as StringValue,
          },
        };
      },
    }),
  ],
  exports: [JwtModule],
})
export class AuthModule {}
