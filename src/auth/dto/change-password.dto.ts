import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsString,
  IsStrongPassword,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidateIf,
} from 'class-validator';

import { Match } from '../../common/validators/match.decorator';
import { PasswordNotEmailConstraint } from '../validators/password-not-email.constraint';

export class ChangePasswordDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com', description: 'The email of the user' })
  email!: string;

  @ValidateIf((o) => o.password != null)
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(128, { message: 'Password must be at most 128 characters long.' })
  @Matches(/^\S+$/, { message: 'Password must not contain spaces.' })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message: 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 symbol.',
    },
  )
  @Validate(PasswordNotEmailConstraint)
  @ApiProperty({
    example: 'Str0ng!Pass',
    description: 'The password of the user',
    required: false,
  })
  password?: string;

  @ValidateIf((o) => o.password != null)
  @IsString()
  @Match('password', { message: 'Confirm password must match password.' })
  @ApiProperty({
    example: 'Str0ng!Pass',
    description: 'The duplicate of password',
    required: false,
  })
  confirmPassword?: string;

  @ValidateIf((o) => o.isWeb != null)
  @IsBoolean()
  @ApiProperty({
    example: true,
    description: 'Whether the request is from web platform',
    required: false,
  })
  isWeb?: boolean;
}
