import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminsModule } from './admins/admins.module';
import { ListingsModule } from './listings/listings.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.enableCors();
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Real Estate Marketplace API')
    .setDescription('Authentication endpoints for user registration and login')
    .setVersion('1.0')
    .addTag('Auth')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'access-token',
    )
    .addTag('Users')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [AuthModule, UsersModule, AdminsModule, ListingsModule],
    autoTagControllers: false,
  });
  const SWAGGER_CDN =
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2';

  SwaggerModule.setup('api-docs', app, document, {
    customCssUrl: [`${SWAGGER_CDN}/swagger-ui.min.css`],
    customJs: [
      `${SWAGGER_CDN}/swagger-ui-bundle.js`,
      `${SWAGGER_CDN}/swagger-ui-standalone-preset.js`,
    ],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
