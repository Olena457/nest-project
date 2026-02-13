import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import { LoggerModule } from 'nestjs-pino';
import type { Options as PinoHttpOptions } from 'pino-http';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FirebaseModule } from './firebase/firebase.module';
import { UserRolesModule } from './user-roles/user-roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !process.env.NODE_ENV ? '.env' : `.env.${process.env.NODE_ENV}`,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const isProd = cfg.get<string>('ENV') === 'production';

        const pinoHttpOptions: PinoHttpOptions = {
          genReqId(req: IncomingMessage, _res: ServerResponse): string {
            void _res;

            return (req.headers['x-request-id'] as string) ?? randomUUID();
          },
          autoLogging: {
            ignore: (req: IncomingMessage) => {
              const url = req.url || '';

              return (
                url.startsWith('/health') ||
                url.startsWith('/api-docs') ||
                url.startsWith('/api-docs-json')
              );
            },
          },
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.body.password',
              'req.body.token',
              'res.headers["set-cookie"]',
            ],
            censor: '[REDACTED]',
          },
          transport: !isProd
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
        };

        return { pinoHttp: pinoHttpOptions };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true, // change for prod
        migrationsRun: false,
        ssl: configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        logging:
          configService.get<string>('ENV') === 'development'
            ? ['error', 'warn', 'schema', 'migration', 'query']
            : ['error', 'warn'],
        maxQueryExecutionTime: 300,
        logger: 'advanced-console',
        extra: {
          max: 20,
          statement_timeout: 10000,
        },
      }),
    }),
    AuthModule,
    UsersModule,
    FirebaseModule,
    UserRolesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
