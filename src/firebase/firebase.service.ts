import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { firstValueFrom } from 'rxjs';
import type { AxiosResponse, AxiosError } from 'axios';

import { EHttpError } from '../common/enums/httpError.enum';
import { normalizeEmail } from '../common/utils/normalize.util';

export interface FirebaseSignUpResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

export interface FirebaseSignInResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId?: string;
}

export interface FirebaseRefreshResponse {
  id_token: string;
  refresh_token: string;
  expires_in: string;
  user_id: string;
  token_type: string;
  project_id?: string;
}

function isAxiosError(err: unknown): err is AxiosError {
  return typeof err === 'object' && err !== null && (err as AxiosError).isAxiosError === true;
}

@Injectable()
export class FirebaseService {
  private readonly apiKey: string;
  private readonly authUrl = 'https://identitytoolkit.googleapis.com/v1/accounts';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject('FirebaseAdmin') private readonly firebaseAdmin: admin.app.App,
  ) {
    const apiKey = this.configService.get<string>('FIREBASE_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Firebase API key is not defined in the environment variables.',
      );
    }

    this.apiKey = apiKey;
  }

  async signUp(email: string, password: string): Promise<FirebaseSignUpResponse> {
    const url = `${this.authUrl}:signUp?key=${this.apiKey}`;

    const data = { email, password, returnSecureToken: true };
    const response: AxiosResponse<FirebaseSignUpResponse> = await firstValueFrom(
      this.httpService.post<FirebaseSignUpResponse>(url, data),
    );

    return response.data;
  }

  async signIn(email: string, password: string): Promise<FirebaseSignInResponse> {
    const url = `${this.authUrl}:signInWithPassword?key=${this.apiKey}`;

    try {
      const data = { email, password, returnSecureToken: true };
      const response: AxiosResponse<FirebaseSignInResponse> = await firstValueFrom(
        this.httpService.post<FirebaseSignInResponse>(url, data),
      );

      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === EHttpError.BAD_REQUEST) {
        throw new BadRequestException('Invalid credentials');
      }

      throw new InternalServerErrorException();
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return this.firebaseAdmin.auth().verifyIdToken(idToken);
  }

  async refreshToken(refreshToken: string): Promise<FirebaseRefreshResponse> {
    const url = `https://securetoken.googleapis.com/v1/token?key=${this.apiKey}`;

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    try {
      const res: AxiosResponse<FirebaseRefreshResponse> = await firstValueFrom(
        this.httpService.post<FirebaseRefreshResponse>(url, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );

      return res.data;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 400) {
        throw new BadRequestException('Invalid refresh token');
      }

      throw new InternalServerErrorException();
    }
  }

  async revokeUserTokens(uid: string): Promise<void> {
    await this.firebaseAdmin.auth().revokeRefreshTokens(uid);
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await this.firebaseAdmin.auth().deleteUser(uid);
    } catch (error: unknown) {
      const msg =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as Error).message
          : String(error);
      throw new InternalServerErrorException(`Failed to delete Firebase user ${uid}: ${msg}`);
    }
  }

  async changePassword(email: string, password: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email);
    const auth = this.firebaseAdmin.auth();

    try {
      const user = await auth.getUserByEmail(normalizedEmail);

      await auth.updateUser(user.uid, { password });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'auth/user-not-found'
      ) {
        throw new NotFoundException('User not found for given email.');
      }

      const detail =
        typeof error === 'object' && error !== null && 'message' in error
          ? `: ${(error as Error).message}`
          : '';
      throw new BadRequestException(`Failed to set password${detail}`.trim());
    }
  }
}
