// import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
// import { NestFactory, Reflector } from '@nestjs/core';
// import { IoAdapter } from '@nestjs/platform-socket.io';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import * as bodyParser from 'body-parser';
// import { json, urlencoded } from 'express';
// import { Logger } from 'nestjs-pino';

// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule, { bufferLogs: true });

//   app.useLogger(app.get(Logger));
//   app.useWebSocketAdapter(new IoAdapter(app));
//   app.enableCors({
//     origin: true,
//     credentials: true,
//     allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
//     methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
//   });

//   const httpAdapter = app.getHttpAdapter();
//   if (httpAdapter.getType() === 'express') {
//     httpAdapter.getInstance().set('trust proxy', true);
//   }

//   app.use('/webhooks/checkr', bodyParser.raw({ type: 'application/json' }));
//   app.use('/webhooks/stripe-connect', bodyParser.raw({ type: 'application/json' }));

//   app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
//   app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

//   app.use(json({ limit: '50mb' }));
//   app.use(urlencoded({ limit: '50mb', extended: true }));

//   app.use((err: any, _req: any, res: any, next: any) => {
//     const isTooLarge =
//       err?.type === 'entity.too.large' || err?.status === 413 || err?.statusCode === 413;

//     if (!isTooLarge) {
//       return next(err);
//     }

//     return res.status(413).json({
//       message: 'Uploaded file is too large. Please upload a smaller file and try again.',
//       details: {
//         maxFileSizeMB: 2.5,
//         supportedFormats: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt', 'doc', 'docx'],
//       },
//     });
//   });

//   app.enableShutdownHooks();

//   const config = new DocumentBuilder()
//     .setTitle('App API')
//     .setDescription(
//       'The API documentation for the App project.\n\n' + '[View full JSON spec](./api-docs-json)',
//     )
//     .setVersion('1.0')
//     // --- 1. Core & Auth ---
//     .addTag('Core: Auth', 'Authentication, Registration, Password Management')
//     .addTag('Core: Users', 'Base User Management')
//     .addTag('Core: Roles', 'RBAC Management')

//     .addBearerAuth()
//     .build();

//   const document = SwaggerModule.createDocument(app, config);

//   app.getHttpAdapter().get('/api-docs-json', (req, res) => {
//     res.json(document);
//   });

//   SwaggerModule.setup('api-docs', app, document, {
//     swaggerOptions: {
//       tagsSorter: 'alpha',
//       operationsSorter: 'alpha',
//       persistAuthorization: true,
//     },
//   });

//   await app.listen(process.env.PORT ?? 3000);
// }

// bootstrap();
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { NextFunction, Request, Response, json, urlencoded } from 'express';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.useWebSocketAdapter(new IoAdapter(app));

  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType() === 'express') {
    httpAdapter.getInstance().set('trust proxy', true);
  }

  app.use('/webhooks/checkr', bodyParser.raw({ type: 'application/json' }));
  app.use('/webhooks/stripe-connect', bodyParser.raw({ type: 'application/json' }));

  // Включаємо трансформацію для DTO (це важливо для нашого firstName/lastName)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Обробка помилок (замінено any на типи Express)
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const isTooLarge =
      err?.type === 'entity.too.large' || err?.status === 413 || err?.statusCode === 413;

    if (!isTooLarge) {
      return next(err);
    }

    return res.status(413).json({
      message: 'Uploaded file is too large. Please upload a smaller file and try again.',
      details: {
        maxFileSizeMB: 2.5,
        supportedFormats: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt', 'doc', 'docx'],
      },
    });
  });

  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('App API')
    .setDescription(
      'The API documentation for the App project.\n\n' + '[View full JSON spec](./api-docs-json)',
    )
    .setVersion('1.0')
    .addTag('Core: Auth')
    .addTag('Core: Users')
    .addTag('Core: Roles')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.getHttpAdapter().get('/api-docs-json', (_req: Request, res: Response) => {
    res.json(document);
  });

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();