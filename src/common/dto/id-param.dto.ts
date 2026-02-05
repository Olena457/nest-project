import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class IdParamDto {
  @ApiProperty({ example: '8a1b2c3d-4e5f-6789-abcd-0123456789ef' })
  @IsUUID('all')
  id!: string;
}
