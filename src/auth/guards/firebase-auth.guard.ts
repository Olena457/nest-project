import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as admin from 'firebase-admin';
import { DataSource } from 'typeorm';
import type { Request } from 'express';

import { User } from '../../users/entities/user.entity';
import { ALLOW_BANNED_USERS_KEY } from '../decorators/allow-banned-users.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @Inject('FirebaseAdmin') private readonly firebaseAdmin: admin.app.App,
    private readonly dataSource: DataSource,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: admin.auth.DecodedIdToken }>();
    const authHeader = request.headers.authorization;
    const idToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : undefined;

    if (!idToken) {
      throw new UnauthorizedException('Authentication token not found.');
    }

    try {
      const decodedToken = await this.firebaseAdmin.auth().verifyIdToken(idToken);
      request.user = decodedToken;

      const allowBannedUsers = this.reflector.getAllAndOverride<boolean>(ALLOW_BANNED_USERS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (!allowBannedUsers) {
        await this.checkBannedStatus(decodedToken.uid);
      }

      return true;
    } catch (err: unknown) {
      if (err instanceof ForbiddenException) {
        throw err;
      }

      throw new UnauthorizedException('Invalid authentication token.');
    }
  }

  private async checkBannedStatus(providerUid: string): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { providerUid },
    });

    if (!user) {
      return;
    }
  }
}
