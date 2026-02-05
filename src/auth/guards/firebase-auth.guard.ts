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
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { ALLOW_BANNED_USERS_KEY } from '../decorators/allow-banned-users.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @Inject('FirebaseAdmin') private readonly firebaseAdmin: admin.app.App,
    private readonly dataSource: DataSource,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const idToken = request.headers.authorization?.split('Bearer ')[1];

    if (!idToken) {
      throw new UnauthorizedException('Authentication token not found.');
    }

    return this.firebaseAdmin
      .auth()
      .verifyIdToken(idToken)
      .then(async (decodedToken) => {
        request.user = decodedToken;

        const allowBannedUsers = this.reflector.getAllAndOverride<boolean>(ALLOW_BANNED_USERS_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);

        if (!allowBannedUsers) {
          await this.checkBannedStatus(decodedToken.uid);
        }

        return true;
      })
      .catch((error) => {
        if (error instanceof ForbiddenException) {
          throw error;
        }

        throw new UnauthorizedException('Invalid authentication token.');
      });
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
