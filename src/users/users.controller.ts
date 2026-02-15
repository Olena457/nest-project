import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import * as admin from 'firebase-admin';

import { User as CurrentUser } from '../auth/decorators/user.decorator';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { ERole } from '../user-roles/enums/role.enum';
import { Roles } from '../user-roles/user-roles.decorator';
import { RolesGuard } from '../user-roles/user-roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { ECropType, EGrowthStatus } from '../users/enums/user-crop.enum';

interface UsersQuery {
  page?: number;
  limit?: number;
  name?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

interface AuthenticatedUser extends admin.auth.DecodedIdToken {
  dbId: string;
  roles: ERole[];
}

@ApiTags('Core: Users')
@ApiBearerAuth()
// two guards!
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
  @ApiBody({ type: CreateUserDto })
  @ApiOperation({ summary: 'Create the user (admin/moderator)' })
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.create(createUserDto, user.uid);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed database with fake users' })
  @ApiResponse({ status: 201, description: 'Seeding completed successfully.' })
  async seed() {
    return await this.usersService.seedUsers();
  }

  @Get()
  @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
  @ApiResponse({ status: 200, description: 'List of users retrieved successfully.', type: [User] })
  @ApiOperation({ summary: 'Get all users (admin/moderator)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records per page',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Search by first name, last name, or email',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ERole,
    description: 'Filter users by role',
  })
  @ApiQuery({
    name: 'hasPhone',
    required: false,
    type: Boolean,
    description: 'Filter phone numbers: true, false',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'email', 'firstName', 'lastName', 'phoneNumber'],
    description: 'Select a field to sort the results',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort direction (Ascending or Descending)',
  })
  @ApiQuery({
    name: 'cropType',
    required: false,
    enum: ECropType,
    description: 'Filter by crop type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EGrowthStatus,
    description: 'Filter by growth status',
  })
  findAll(@Query() query: UsersQuery) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile.', type: User })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    //  FirebaseAuthGuard спрацював!
    // console.warn('!!!User from Decorator:', user);

    return this.usersService.findOne(user.dbId);
  }

  @Get(':id')
  @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
  @ApiResponse({ status: 200, description: 'The found user.', type: User })
  @ApiOperation({ summary: 'Get user by ID (admin/moderator)' })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
  @ApiBody({ type: UpdateUserDto })
  @ApiOperation({ summary: 'Update the user (admin/moderator)' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
  @ApiOperation({ summary: 'Delete the user (admin/moderator)' })
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.remove(id);
  }
}
