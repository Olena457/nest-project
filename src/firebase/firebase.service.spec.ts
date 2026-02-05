import type { HttpService } from '@nestjs/axios';
import type { ConfigService } from '@nestjs/config';
import type * as admin from 'firebase-admin';

import { FirebaseService } from './firebase.service';

describe('FirebaseService.changePassword', () => {
  const httpServiceMock = {} as HttpService;
  const configServiceMock = {
    get: jest.fn(),
  } as unknown as ConfigService;

  let authMock: {
    getUserByEmail: jest.Mock;
    updateUser: jest.Mock;
  };
  let firebaseAdminMock: admin.app.App;
  let service: FirebaseService;

  beforeEach(() => {
    authMock = {
      getUserByEmail: jest.fn(),
      updateUser: jest.fn(),
    };

    firebaseAdminMock = {
      auth: jest.fn(() => authMock),
    } as unknown as admin.app.App;

    (configServiceMock.get as jest.Mock).mockReset();
    (configServiceMock.get as jest.Mock).mockImplementation((key: string) =>
      key === 'FIREBASE_API_KEY' ? 'test-key' : undefined,
    );

    service = new FirebaseService(httpServiceMock, configServiceMock, firebaseAdminMock);
  });

  it('normalizes email before updating password', async () => {
    authMock.getUserByEmail.mockResolvedValue({ uid: 'firebase-uid' });

    await service.changePassword('Invitee@Example.com', 'Str0ng!Pass1');

    expect(authMock.getUserByEmail).toHaveBeenCalledWith('invitee@example.com');
    expect(authMock.updateUser).toHaveBeenCalledWith('firebase-uid', { password: 'Str0ng!Pass1' });
  });

  it('maps auth/user-not-found to NotFoundException', async () => {
    authMock.getUserByEmail.mockRejectedValue({
      code: 'auth/user-not-found',
      message: 'not found',
    });

    await expect(service.changePassword('missing@example.com', 'Str0ng!Pass1')).rejects.toThrow(
      'User not found for given email.',
    );

    expect(authMock.updateUser).not.toHaveBeenCalled();
  });

  it('wraps other errors as BadRequestException', async () => {
    authMock.getUserByEmail.mockResolvedValue({ uid: 'firebase-uid' });
    authMock.updateUser.mockRejectedValue({ message: 'boom' });

    await expect(service.changePassword('user@example.com', 'Str0ng!Pass1')).rejects.toThrow(
      'Failed to set password: boom',
    );
  });
});
