import { forwardRef, Module } from '@nestjs/common';

import { FirebaseModule } from '../firebase/firebase.module';
import { UserRolesModule } from '../user-roles/user-roles.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { PasswordNotEmailConstraint } from './validators/password-not-email.constraint';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => FirebaseModule),
    forwardRef(() => UserRolesModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, FirebaseAuthGuard, PasswordNotEmailConstraint],
  exports: [AuthService, FirebaseAuthGuard],
})
export class AuthModule {}
