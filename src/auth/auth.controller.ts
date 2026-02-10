import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAuthDto, LoginDto } from './dto/create-auth.dto';
import { RefreshDto } from './dto/refresh.dto';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';

@ApiTags('Core: Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateAuthDto })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.', type: User })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  signUp(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.signUp(createAuthDto);
  }

  @Post('sign-in')
  @ApiOperation({ summary: 'Sign in a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Successful login.' })
  signIn(@Body() loginDto: LoginDto) {
    return this.authService.signIn(loginDto);
  }

  @Post('google/sign-in')
  @ApiOperation({ summary: 'Sign in or sign up with Google' })
  @ApiBody({ type: CreateAuthDto })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created/retrieved.',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  googleSignIn(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.socialSignIn(createAuthDto);
  }

  @Post('apple/sign-in')
  @ApiOperation({ summary: 'Sign in or sign up with Apple' })
  @ApiBody({ type: CreateAuthDto })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created/retrieved.',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  appleSignIn(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.socialSignIn(createAuthDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Exchange refresh token for a new id token' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 200, description: 'Tokens refreshed.' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed.' })
  changePassword(@Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(dto);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout (audit only)' })
  logout() {
    return this.authService.logout();
  }
}
