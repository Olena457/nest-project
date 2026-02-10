import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

import { UsersService } from '../../users/users.service';

@Injectable()
export class WsFirebaseAuthGuard implements CanActivate {
  constructor(
    @Inject('FirebaseAdmin') private readonly firebaseAdmin: admin.app.App,
    private readonly users: UsersService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const rawClient: unknown = ctx.switchToWs().getClient();

    function isWsClient(obj: unknown): obj is {
      handshake?: {
        headers?: Record<string, string>;
        auth?: Record<string, unknown>;
        query?: Record<string, string>;
      };
      data?: { user?: admin.auth.DecodedIdToken; userId?: string; email?: string };
    } {
      return typeof obj === 'object' && obj !== null;
    }

    if (!isWsClient(rawClient)) {
      throw new UnauthorizedException('Invalid client');
    }

    const client = rawClient;

    const authHeader = client.handshake?.headers?.authorization;
    const bearer =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : undefined;
    const token =
      (client.handshake?.auth?.token as string | undefined) ||
      bearer ||
      client.handshake?.query?.token;

    if (!token) {
      throw new UnauthorizedException('Authentication token not found.');
    }

    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await this.firebaseAdmin.auth().verifyIdToken(token);
    } catch {
      throw new UnauthorizedException('Invalid authentication token.');
    }

    const dbUser = await this.users.findByProviderUid(decoded.uid);
    if (!dbUser) {
      throw new UnauthorizedException('User not found.');
    }

    client.data = client.data || {};
    client.data.user = decoded;
    client.data.userId = dbUser.id;
    client.data.email = dbUser.email;

    return true;
  }
}
