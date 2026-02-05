import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

import { safeParseJSON } from '../common/helpers';
import { FirebaseService } from './firebase.service';

@Global()
@Module({
  imports: [HttpModule, ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    FirebaseService,
    {
      provide: 'FirebaseAdmin',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        if (admin.apps.length) {
          return admin.app();
        }

        const jsonRaw = config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');

        let credential: admin.credential.Credential;

        if (jsonRaw) {
          const decoded = Buffer.from(jsonRaw, 'base64').toString('utf8');
          const sa = safeParseJSON(decoded) ?? safeParseJSON(jsonRaw);

          if (!sa) {
            throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON');
          }

          credential = admin.credential.cert(sa as ServiceAccount);
        } else {
          credential = admin.credential.applicationDefault();
        }

        return admin.initializeApp({
          credential,
          projectId: config.get<string>('FIREBASE_PROJECT_ID') || undefined,
        });
      },
    },
  ],
  exports: [FirebaseService, 'FirebaseAdmin'],
})
export class FirebaseModule {}
