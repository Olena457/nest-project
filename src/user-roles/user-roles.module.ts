import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import { UserRole } from './entities/user-role.entity';
import { UserRolesController } from './user-roles.controller';
import { RolesGuard } from './user-roles.guard';
import { UserRolesService } from './user-roles.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserRole]), forwardRef(() => UsersModule)],
  controllers: [UserRolesController],
  providers: [UserRolesService, RolesGuard],
  exports: [UserRolesService, RolesGuard],
})
export class UserRolesModule {}
