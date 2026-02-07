import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'firebase:12345',
    description: 'Auth provider UID (e.g., Firebase UID)',
  })
  @IsString()
  @Length(1, 255)
  providerUid?: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Unique email (lowercased)',
  })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
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
// change user schema
