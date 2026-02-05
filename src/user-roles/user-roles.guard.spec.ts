import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ERole } from './enums/role.enum';
import { RolesGuard } from './user-roles.guard';

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const usersService = {
    findByProviderUid: jest.fn(),
  };
  const userRolesService = {
    listRoles: jest.fn(),
  };
  const adminRepository = {
    findOne: jest.fn(),
  };
  const dataSource = {
    getRepository: jest.fn().mockReturnValue(adminRepository),
  } as any;

  const guard = new RolesGuard(reflector, usersService as any, userRolesService as any, dataSource);

  const buildContext = (req: any): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  const getAllAndOverrideSpy = jest.spyOn(reflector, 'getAllAndOverride');

  beforeEach(() => {
    getAllAndOverrideSpy.mockClear();
    getAllAndOverrideSpy.mockReturnValue([ERole.MODERATOR]);
    usersService.findByProviderUid.mockReset();
    userRolesService.listRoles.mockReset();
    adminRepository.findOne.mockReset();
    dataSource.getRepository.mockClear();
    dataSource.getRepository.mockReturnValue(adminRepository);
  });

  it('throws ForbiddenException when required role is missing', async () => {
    const req = { user: { uid: 'firebase-uid' } };

    usersService.findByProviderUid.mockResolvedValue({ id: 'user-id' });
    userRolesService.listRoles.mockResolvedValue([]);
    adminRepository.findOne.mockResolvedValue(null);

    await expect(guard.canActivate(buildContext(req))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws UnauthorizedException when firebase uid missing', async () => {
    const req = {};

    await expect(guard.canActivate(buildContext(req))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
