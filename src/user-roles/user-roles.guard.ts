import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UsersService } from '../users/users.service';
import { ERole } from './enums/role.enum';
import { ROLES_KEY } from './user-roles.decorator';
import { UserRolesService } from './user-roles.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly userRolesService: UserRolesService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ERole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest<{ user?: { uid?: string }; userRoles?: ERole[] }>();
    const decoded = req.user;
    if (!decoded?.uid) {
      throw new UnauthorizedException('No Firebase uid on request');
    }

    const appUser = await this.usersService.findByProviderUid(decoded.uid);
    if (!appUser) {
      throw new UnauthorizedException('User not registered');
    }

    const roles = await this.userRolesService.listRoles(appUser.id);
    const effectiveRoles = new Set(roles.map((r) => r.role));

    const userRoles = Array.from(effectiveRoles);

    const allowed = requiredRoles.some((r) => effectiveRoles.has(r));
    if (!allowed) {
      throw new ForbiddenException('Insufficient role');
    }

    req.userRoles = userRoles;

    return true;
  }
}
