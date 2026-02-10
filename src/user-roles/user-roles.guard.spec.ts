import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UsersService } from '../users/users.service';
import type { UserRolesService } from './user-roles.service';
import type { DataSource } from 'typeorm';

import { ERole } from './enums/role.enum';
import { RolesGuard } from './user-roles.guard';

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const usersService: Partial<UsersService> = {
    findByProviderUid: jest.fn(),
  };
  const userRolesService: Partial<UserRolesService> = {
    listRoles: jest.fn(),
  };
  const adminRepository = {
    findOne: jest.fn(),
  };
  const dataSource: Partial<DataSource> = {
    getRepository: jest.fn().mockReturnValue(adminRepository),
  };

  const guard = new RolesGuard(
    reflector,
    usersService as UsersService,
    userRolesService as UserRolesService,
    dataSource as DataSource,
  );

  type ReqLike = { user?: { uid?: string }; userRoles?: string[] };
  const buildContext = (req: ReqLike): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  const getAllAndOverrideSpy = jest.spyOn(reflector, 'getAllAndOverride');

  beforeEach(() => {
    getAllAndOverrideSpy.mockClear();
    getAllAndOverrideSpy.mockReturnValue([ERole.MODERATOR]);
    (usersService.findByProviderUid as jest.Mock).mockReset();
    (userRolesService.listRoles as jest.Mock).mockReset();
    adminRepository.findOne.mockReset();
    (dataSource.getRepository as jest.Mock).mockClear();
    (dataSource.getRepository as jest.Mock).mockReturnValue(adminRepository);
  });

  it('throws ForbiddenException when required role is missing', async () => {
    const req = { user: { uid: 'firebase-uid' } };

    (usersService.findByProviderUid as jest.Mock).mockResolvedValue({ id: 'user-id' });
    (userRolesService.listRoles as jest.Mock).mockResolvedValue([]);
    adminRepository.findOne.mockResolvedValue(null);

    try {
      await guard.canActivate(buildContext(req));
      throw new Error('Expected ForbiddenException');
    } catch (err: unknown) {
      if (!(err instanceof ForbiddenException)) {
        throw err;
      }
    }
  });

  it('throws UnauthorizedException when firebase uid missing', async () => {
    const req = {};

    try {
      await guard.canActivate(buildContext(req));
      throw new Error('Expected UnauthorizedException');
    } catch (err: unknown) {
      if (!(err instanceof UnauthorizedException)) {
        throw err;
      }
    }
  });
});
