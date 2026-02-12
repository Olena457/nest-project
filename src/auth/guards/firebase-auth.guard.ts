// import {
//   CanActivate,
//   ExecutionContext,
//   ForbiddenException,
//   Inject,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import * as admin from 'firebase-admin';
// import { DataSource } from 'typeorm';
// import type { Request } from 'express';

// import { User } from '../../users/entities/user.entity';
// import { ALLOW_BANNED_USERS_KEY } from '../decorators/allow-banned-users.decorator';

// @Injectable()
// export class FirebaseAuthGuard implements CanActivate {
//   constructor(
//     @Inject('FirebaseAdmin') private readonly firebaseAdmin: admin.app.App,
//     private readonly dataSource: DataSource,
//     private readonly reflector: Reflector,
//   ) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context
//       .switchToHttp()
//       .getRequest<Request & { user?: admin.auth.DecodedIdToken }>();
//     const authHeader = request.headers.authorization;
//     const idToken =
//       typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
//         ? authHeader.slice(7)
//         : undefined;

//     if (!idToken) {
//       throw new UnauthorizedException('Authentication token not found.');
//     }

//     try {
//       // console.warn('!!! LOG: ПЕРЕВІРЯЄМО токен:', idToken.substring(0, 20) + '...');
//       const decodedToken = await this.firebaseAdmin.auth().verifyIdToken(idToken);
//       // console.warn('!!! LOG: токен ВАЛІДНИЙ, UID:', decodedToken.uid);
//       request.user = decodedToken;

//       const allowBannedUsers = this.reflector.getAllAndOverride<boolean>(ALLOW_BANNED_USERS_KEY, [
//         context.getHandler(),
//         context.getClass(),
//       ]);

//       if (!allowBannedUsers) {
//         await this.checkBannedStatus(decodedToken.uid);
//       }

//       return true;
//     } catch (err: any) {
//       // console.warn('!!! ПОМИЛКА ВІД FIREBASE:', err?.message || err);
//       if (err instanceof ForbiddenException) {
//         throw err;
//       }

//       throw new UnauthorizedException('Invalid authentication token.');
//     }
//   }

//   private async checkBannedStatus(providerUid: string): Promise<void> {
//     const userRepository = this.dataSource.getRepository(User);
//     const user = await userRepository.findOne({
//       where: { providerUid },
//     });

//     if (!user) {
//       return;
//     }
//   }
// }
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
