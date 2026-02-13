import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ERole } from './enums/role.enum';
import { ROLES_KEY } from './user-roles.decorator';
import { AuthenticatedRequest } from '../auth/guards/firebase-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ERole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = await Promise.resolve(
      context.switchToHttp().getRequest<AuthenticatedRequest>(),
    );

    const user = request.user;

    // LOGS DELETE
    // console.warn('--- RolesGuard Async Check ---');
    // console.warn('User found in request:', !!user);

    if (!user) {
      throw new ForbiddenException('User session not found');
    }

    console.warn('User roles from DB:', JSON.stringify(user.roles));
    console.warn('Required roles:', JSON.stringify(requiredRoles));

    if (!user.roles || user.roles.length === 0) {
      throw new ForbiddenException('User has no assigned roles in database');
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      const userRolesStr = user.roles.join(', ');
      const reqRolesStr = requiredRoles.join(', ');

      console.warn(`Access denied. User roles: ${userRolesStr}. Required: ${reqRolesStr}`);
      throw new ForbiddenException('You do not have the required permissions');
    }

    return true;
  }
}
