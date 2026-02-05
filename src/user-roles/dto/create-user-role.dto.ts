import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { ERole } from '../enums/role.enum';

export class CreateUserRoleDto {
  @ApiProperty({ example: 'superadmin', description: 'User role' })
  @IsEnum(ERole)
  role: string;
}
