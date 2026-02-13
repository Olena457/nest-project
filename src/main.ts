import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { NextFunction, Request, Response, json, urlencoded } from 'express';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';

interface HttpError {
  type?: string;
  status?: number | string;
  statusCode?: number | string;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.useWebSocketAdapter(new IoAdapter(app));

  app.enableCors({
    origin: ['http://localhost:4000', 'http://localhost:3000'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.set('trust proxy', true);

  app.use('/webhooks/checkr', bodyParser.raw({ type: 'application/json' }));
  app.use('/webhooks/stripe-connect', bodyParser.raw({ type: 'application/json' }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const error = err as HttpError;
    const isTooLarge =
      error?.type === 'entity.too.large' ||
      Number(error?.status) === 413 ||
      Number(error?.statusCode) === 413;

    if (!isTooLarge) {
      return next(err);
    }

    return res.status(413).json({
      message: 'Uploaded file is too large.',
      details: { maxFileSizeMB: 2.5 },
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

bootstrap().catch((err: unknown) => {
  console.error('Error during application bootstrap', err);
  process.exit(1);
});
