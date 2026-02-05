import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com', description: 'The email of the user' })
  email!: string;
}
