// import {
//   BadRequestException,
//   ConflictException,
//   Injectable,
//   InternalServerErrorException,
//   NotFoundException,
//   UnauthorizedException,
// } from '@nestjs/common';

// import { FirebaseService } from '../firebase/firebase.service';
// import { UserRolesService } from '../user-roles/user-roles.service';
// import { UsersService } from '../users/users.service';
// import { ChangePasswordDto } from './dto/change-password.dto';
// import { CreateAuthDto, LoginDto } from './dto/create-auth.dto';
// import { RefreshDto } from './dto/refresh.dto';

// const MSG = {
//   NOT_FOUND: 'Password not found.',
//   NOT_MATCH: 'Passwords do not match.',
//   VERIFICATION_REQUIRED: 'Email verification is required before changing password.',
// } as const;

// @Injectable()
// export class AuthService {
//   constructor(
//     private readonly firebaseService: FirebaseService,
//     private readonly usersService: UsersService,
//     private readonly userRolesService: UserRolesService,
//   ) {}

//   async signUp(createAuthDto: CreateAuthDto) {
//     const { email, password, confirmPassword } = createAuthDto;
//     let firebaseUser: { localId: string };

//     if (!password) {
//       throw new BadRequestException('Password is required for email/password sign-up.');
//     }

//     if (!confirmPassword || password !== confirmPassword) {
//       throw new BadRequestException('Confirm password is missing or invalid.');
//     }

//     try {
//       firebaseUser = await this.firebaseService.signUp(email, password);
//     } catch (error) {
//       if (error?.response?.data?.error?.message === 'EMAIL_EXISTS') {
//         throw new ConflictException('Email already exists');
//       }

//       throw new InternalServerErrorException(error?.message || 'Error creating user in Firebase');
//     }

//     const firebaseUid = firebaseUser.localId;

//     try {
//       const user = await this.usersService.create({ email }, firebaseUid);
//       await this.userRolesService.createDefaultForUser(user.id);

//       return { firebaseUser, user };
//     } catch (dbError) {
//       await this.firebaseService.deleteUser(firebaseUid);

//       throw new InternalServerErrorException(`User registration failed: ${dbError?.message}`);
//     }
//   }

//   signIn(loginDto: LoginDto) {
//     const { email, password } = loginDto;

//     if (!password) {
//       throw new BadRequestException('Password is required for email/password sign-in.');
//     }

//     return this.firebaseService.signIn(email, password);
//   }

//   async socialSignIn(createAuthDto: CreateAuthDto) {
//     const { idToken, ...userDetails } = createAuthDto;

//     if (!idToken) {
//       throw new UnauthorizedException('ID token is required for social sign-in.');
//     }

//     try {
//       const decodedToken = await this.firebaseService.verifyIdToken(idToken);
//       const { uid, email } = decodedToken;

//       let user = await this.usersService.findByProviderUid(uid);

//       if (!user) {
//         user = await this.usersService.create({ ...userDetails, email: email! }, uid);
//         await this.userRolesService.createDefaultForUser(user.id);
//       }

//       return { firebaseUser: decodedToken, user };
//     } catch (error) {
//       throw new InternalServerErrorException(error.message);
//     }
//   }

//   async refresh(dto: RefreshDto) {
//     const { refreshToken } = dto;

//     if (!refreshToken) {
//       throw new BadRequestException('refreshToken is required.');
//     }

//     const data = await this.firebaseService.refreshToken(refreshToken);

//     return {
//       idToken: data.id_token,
//       refreshToken: data.refresh_token,
//       expiresIn: Number(data.expires_in),
//       userId: data.user_id,
//       tokenType: data.token_type,
//       projectId: data.project_id,
//     };
//   }

//   async changePassword(dto: ChangePasswordDto) {
//     if (!dto.password) {
//       throw new NotFoundException(MSG.NOT_FOUND);
//     }

//     if (dto.password !== dto.confirmPassword) {
//       throw new NotFoundException(MSG.NOT_MATCH);
//     }

//     try {
//       await this.firebaseService.changePassword(dto.email, dto.password);

//       return { success: true, message: 'Password updated successfully' };
//     } catch (error) {
//       throw new BadRequestException(error.message);
//     }
//   }

//   async logout() {
//     return { ok: true };
//   }
// }
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { FirebaseService } from '../firebase/firebase.service';
import { UserRolesService } from '../user-roles/user-roles.service';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAuthDto, LoginDto } from './dto/create-auth.dto';
import { RefreshDto } from './dto/refresh.dto';

interface FirebaseError {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
    };
  };
  message?: string;
}

function isFirebaseError(err: unknown): err is FirebaseError {
  return typeof err === 'object' && err !== null && 'response' in err;
}

const MSG = {
  NOT_FOUND: 'Password not found.',
  NOT_MATCH: 'Passwords do not match.',
  VERIFICATION_REQUIRED: 'Email verification is required before changing password.',
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
    private readonly userRolesService: UserRolesService,
  ) {}

  // async signUp(createAuthDto: CreateAuthDto) {
  //   const { email, password, confirmPassword } = createAuthDto;

  //   if (!password) {
  //     throw new BadRequestException('Password is required for email/password sign-up.');
  //   }

  //   if (!confirmPassword || password !== confirmPassword) {
  //     throw new BadRequestException('Confirm password is missing or invalid.');
  //   }

  //   try {
  //     const firebaseUser = await this.firebaseService.signUp(email, password);
  //     const firebaseUid = firebaseUser.localId;

  //     try {
  //       const user = await this.usersService.create({ email }, firebaseUid);
  //       await this.userRolesService.createDefaultForUser(user.id);

  //       return { firebaseUser, user };
  //     } catch (dbErr: unknown) {
  //       await this.firebaseService.deleteUser(firebaseUid);
  //       const msg =
  //         typeof dbErr === 'object' && dbErr !== null && 'message' in dbErr
  //           ? (dbErr as Error).message
  //           : String(dbErr);
  //       throw new InternalServerErrorException(`User registration failed: ${msg}`);
  //     }
  //   } catch (err: unknown) {
  //     if (isFirebaseError(err) && err.response?.data?.error?.message === 'EMAIL_EXISTS') {
  //       throw new ConflictException('Email already exists');
  //     }

  //     const msg =
  //       typeof err === 'object' && err !== null && 'message' in err
  //         ? (err as Error).message
  //         : String(err);
  //     throw new InternalServerErrorException(msg || 'Error creating user in Firebase');
  //   }
  // }
  async signUp(createAuthDto: CreateAuthDto) {
    const { email, password, confirmPassword, firstName, lastName, phoneNumber } = createAuthDto;

    if (!password) {
      throw new BadRequestException('Password is required for email/password sign-up.');
    }

    if (!confirmPassword || password !== confirmPassword) {
      throw new BadRequestException('Confirm password is missing or invalid.');
    }

    try {
      const firebaseUser = await this.firebaseService.signUp(email, password);
      const firebaseUid = firebaseUser.localId;

      try {
        const user = await this.usersService.create(
          {
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            phoneNumber: phoneNumber || undefined,
          },
          firebaseUid,
        );

        await this.userRolesService.createDefaultForUser(user.id);

        const fullUser = await this.usersService.findByProviderUid(firebaseUid);

        return { firebaseUser, user: fullUser };
      } catch (dbErr: unknown) {
        await this.firebaseService.deleteUser(firebaseUid);
        const msg =
          typeof dbErr === 'object' && dbErr !== null && 'message' in dbErr
            ? (dbErr as Error).message
            : String(dbErr);
        throw new InternalServerErrorException(`User registration failed: ${msg}`);
      }
    } catch (err: unknown) {
      if (isFirebaseError(err) && err.response?.data?.error?.message === 'EMAIL_EXISTS') {
        throw new ConflictException('Email already exists');
      }

      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as Error).message
          : String(err);
      throw new InternalServerErrorException(msg || 'Error creating user in Firebase');
    }
  }

  signIn(loginDto: LoginDto) {
    const { email, password } = loginDto;
    if (!password) {
      throw new BadRequestException('Password is required for email/password sign-in.');
    }

    return this.firebaseService.signIn(email, password);
  }

  async socialSignIn(createAuthDto: CreateAuthDto) {
    const { idToken, firstName, lastName, phoneNumber } = createAuthDto;

    if (!idToken) {
      throw new UnauthorizedException('ID token is required for social sign-in.');
    }

    try {
      const decodedToken = await this.firebaseService.verifyIdToken(idToken);
      const { uid, email } = decodedToken;

      let user = await this.usersService.findByProviderUid(uid);

      if (!user) {
        user = await this.usersService.create(
          {
            email: email!,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            phoneNumber: phoneNumber || undefined,
          },
          uid,
        );
        await this.userRolesService.createDefaultForUser(user.id);
      }

      return { firebaseUser: decodedToken, user };
    } catch (err: unknown) {
      const error = err as Error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async refresh(dto: RefreshDto) {
    const { refreshToken } = dto;

    if (!refreshToken) {
      throw new BadRequestException('refreshToken is required.');
    }

    const data = await this.firebaseService.refreshToken(refreshToken);

    return {
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      expiresIn: Number(data.expires_in),
      userId: data.user_id,
      tokenType: data.token_type,
      projectId: data.project_id,
    };
  }

  async changePassword(dto: ChangePasswordDto) {
    if (!dto.password) {
      throw new NotFoundException(MSG.NOT_FOUND);
    }

    if (dto.password !== dto.confirmPassword) {
      throw new NotFoundException(MSG.NOT_MATCH);
    }

    try {
      await this.firebaseService.changePassword(dto.email, dto.password);

      return { success: true, message: 'Password updated successfully' };
    } catch (err: unknown) {
      const error = err as Error;
      throw new BadRequestException(error.message);
    }
  }

  logout() {
    return { ok: true };
  }
}
