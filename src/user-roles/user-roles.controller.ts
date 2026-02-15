import { Body, Controller, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { SetUserRoleDto } from './dto/set-user-role.dto';
import { UserRole } from './entities/user-role.entity';
import { ERole } from './enums/role.enum';
import { Roles } from './user-roles.decorator';
import { RolesGuard } from './user-roles.guard';
import { UserRolesService } from './user-roles.service';

@ApiTags('Core: Roles')
@ApiBearerAuth()
@Controller('users')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class UserRolesController {
  constructor(private readonly service: UserRolesService) {}

  @Patch(':id/role')
  @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
  @ApiBody({ type: SetUserRoleDto })
  @ApiOkResponse({ type: UserRole })
  @ApiOperation({ summary: 'Grant the role for user (admin/moderator)' })
  async grantRole(
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() dto: SetUserRoleDto,
  ): Promise<UserRole> {
    return this.service.grantRole(userId, dto.role);
  }
}
