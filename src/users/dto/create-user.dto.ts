import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ERole } from '../../user-roles/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'firebase:12345',
    description: 'Auth provider UID (e.g., Firebase UID)',
  })
  @IsString()
  @Length(1, 255)
  @IsOptional()
  readonly providerUid?: string;

  @ApiPropertyOptional({ example: 'Lucas', description: 'First name of the user' })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  readonly firstName?: string;

  @ApiPropertyOptional({ example: 'Smith', description: 'Last name of the user' })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  readonly lastName?: string;

  @ApiPropertyOptional({ enum: ERole, example: ERole.GUEST })
  @IsEnum(ERole)
  @IsOptional()
  readonly role?: ERole;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Unique email (lowercased)',
  })
  @IsEmail()
  @IsString()
  @Transform(({ value }: TransformFnParams) => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }

    return '';
  })
  readonly email!: string;

  @ApiPropertyOptional({
    example: '+380501234567',
    description: 'Phone number in E.164 format (optional)',
  })
  @IsOptional()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'phoneNumber must be E.164 format, e.g. +380501234567',
  })
  readonly phoneNumber?: string;
}
