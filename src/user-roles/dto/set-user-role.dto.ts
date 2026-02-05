import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { ERole } from '../enums/role.enum';

export class SetUserRoleDto {
  @ApiProperty({ enum: ERole })
  @IsEnum(ERole)
  role!: ERole;
}
