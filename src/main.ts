import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType, ValidationPipe, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminsModule } from './admins/admins.module';
import { ListingsModule } from './listings/listings.module';
import { RequestsModule } from './request/requests.module';

async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
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
    include: [AuthModule, UsersModule, AdminsModule, RequestsModule],
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

  return app;
}

let cachedServer: any;

export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    const app = await createNestApp();
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer(req, res);
}

if (!process.env.VERCEL) {
  (async () => {
    const app = await createNestApp();
    await app.listen(process.env.PORT ?? 3000);
  })();
}

