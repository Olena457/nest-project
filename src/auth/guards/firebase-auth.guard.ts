import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { ERole } from '../../user-roles/enums/role.enum';

export interface AuthenticatedRequest extends Request {
  user: admin.auth.DecodedIdToken & {
    dbId: string;
    roles: ERole[];
  };
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @Inject('FirebaseAdmin') private readonly firebaseAdmin: admin.app.App,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const idToken = authHeader.split(' ')[1];

    if (!idToken) {
      throw new UnauthorizedException('Token not found in header');
    }

    try {
      const decodedToken = await this.firebaseAdmin.auth().verifyIdToken(idToken);

      let dbUser = await this.usersService.findByProviderUid(decodedToken.uid);

      if (!dbUser) {
        dbUser = await this.usersService.createFromFirebaseToken(decodedToken);
      }

      request.user = {
        ...decodedToken,
        dbId: dbUser.id,
        roles: dbUser.roles ? dbUser.roles.map((r) => r.role) : [],
      };

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('FirebaseAuthGuard Error:', message);

      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}
