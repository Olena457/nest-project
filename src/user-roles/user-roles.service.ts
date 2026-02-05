import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { UserRole } from './entities/user-role.entity';
import { ERole } from './enums/role.enum';

@Injectable()
export class UserRolesService {
  constructor(
    @InjectRepository(UserRole)
    private readonly repo: Repository<UserRole>,
  ) {}

  async createDefaultForUser(userId: string): Promise<UserRole> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(UserRole)
      .values({ userId, role: ERole.GUEST })
      .orIgnore()
      .execute();

    const roles = await this.listRoles(userId);
    const guest = roles.find((r) => r.role === ERole.GUEST);

    return (
      guest ??
      roles[0] ??
      (() => {
        throw new NotFoundException('User role not found');
      })()
    );
  }

  async grantRole(userId: string, role: ERole): Promise<UserRole> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(UserRole)
      .values({ userId, role })
      .orIgnore()
      .execute();

    const found = await this.repo.findOne({ where: { userId, role } });
    if (!found) {
      throw new NotFoundException('User role not found after grant');
    }

    return found;
  }

  async revokeRole(userId: string, role: ERole): Promise<void> {
    await this.repo.delete({ userId, role });
  }

  async listRoles(userId: string): Promise<UserRole[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async hasAnyRoles(userId: string, roles: ERole[]): Promise<boolean> {
    if (!roles?.length) {
      return true;
    }

    const count = await this.repo.count({ where: { userId, role: In(roles) } });

    return count > 0;
  }

  async hasAllRoles(userId: string, roles: ERole[]): Promise<boolean> {
    if (!roles?.length) {
      return true;
    }

    const found = await this.repo.find({ where: { userId, role: In(roles) } });

    return new Set(found.map((r) => r.role)).size === new Set(roles).size;
  }
}
