import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

import { ERole } from '../../user-roles/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'firebase:12345',
    description: 'Auth provider UID (e.g., Firebase UID)',
  })
  @IsString()
  @Length(1, 255)
  @IsOptional() // added, if provider UID  is provided
  providerUid?: string;

  @ApiProperty({ example: 'Lucas', description: 'Hame user' })
  @IsString()
  @Length(2, 50)
  firstName!: string;

  @ApiProperty({ example: 'Smith', description: 'Last name' })
  @IsString()
  @Length(2, 50)
  lastName!: string;

  @ApiPropertyOptional({ enum: ERole, example: ERole.GUEST })
  @IsEnum(ERole)
  @IsOptional()
  role?: ERole;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Unique email (lowercased)',
  })
  @IsEmail()
  @IsString()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }

    return '';
  })
  email!: string;

  @ApiPropertyOptional({
    example: '+380501234567',
    description: 'Phone number in E.164 format (optional)',
  })
  @IsOptional()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'phoneNumber must be E.164 format, e.g. +380501234567',
  })
  phoneNumber?: string;
}
