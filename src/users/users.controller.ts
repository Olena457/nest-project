// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   Param,
//   ParseUUIDPipe,
//   Patch,
//   Post,
//   Query,
//   UseGuards,
// } from '@nestjs/common';
// import {
//   ApiBearerAuth,
//   ApiBody,
//   ApiOperation,
//   ApiQuery,
//   ApiResponse,
//   ApiTags,
// } from '@nestjs/swagger';
// import type { DecodedIdToken } from 'firebase-admin/auth';

// import { User as CurrentUser } from '../auth/decorators/user.decorator';
// import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
// import { ERole } from '../user-roles/enums/role.enum';
// import { Roles } from '../user-roles/user-roles.decorator';
// import { RolesGuard } from '../user-roles/user-roles.guard';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { User } from './entities/user.entity';
// import { UsersService } from './users.service';

// interface UsersQuery {
//   page?: number;
//   limit?: number;
//   name?: string;
//   sortBy?: string;
//   order?: 'ASC' | 'DESC';
// }

// @ApiTags('Core: Users')
// @ApiBearerAuth()
// @UseGuards(FirebaseAuthGuard)
// @Controller('users')
// export class UsersController {
//   constructor(private readonly usersService: UsersService) {}

//   @Post()
//   @UseGuards(RolesGuard)
//   @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
//   @ApiBody({ type: CreateUserDto })
//   @ApiOperation({ summary: 'Create the user (admin/moderator)' })
//   create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: DecodedIdToken) {
//     return this.usersService.create(createUserDto, user.uid);
//   }

//   @Post('seed')
//   @ApiOperation({ summary: 'Seed database with 40 fake users (No auth required for dev)' })
//   @ApiResponse({ status: 201, description: 'Seeding completed successfully.' })
//   async seed() {
//     return await this.usersService.seedUsers();
//   }

//   @Get()
//   @UseGuards(RolesGuard)
//   @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
//   @ApiResponse({ status: 200, description: 'List of users.', type: [User] })
//   @ApiOperation({ summary: 'Get all users (admin/moderator)' })
//   @ApiQuery({ name: 'page', required: false, type: Number })
//   @ApiQuery({ name: 'limit', required: false, type: Number })
//   @ApiQuery({ name: 'name', required: false, type: String })
//   @ApiQuery({ name: 'sortBy', required: false, enum: ['email', 'created_at'] })
//   @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
//   findAll(@Query() query: UsersQuery) {
//     return this.usersService.findAll(query);
//   }

//   @Get(':id')
//   @UseGuards(RolesGuard)
//   @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
//   @ApiResponse({ status: 200, description: 'The found user.', type: User })
//   @ApiOperation({ summary: 'Get user by ID (admin/moderator)' })
//   findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
//     return this.usersService.findOne(id);
//   }

//   @Patch(':id')
//   @UseGuards(RolesGuard)
//   @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
//   @ApiBody({ type: UpdateUserDto })
//   @ApiOperation({ summary: 'Update the user (admin/moderator)' })
//   update(
//     @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
//     @Body() updateUserDto: UpdateUserDto,
//   ) {
//     return this.usersService.update(id, updateUserDto);
//   }

//   @Delete(':id')
//   @UseGuards(RolesGuard)
//   @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
//   @ApiOperation({ summary: 'Delete the user (admin/moderator)' })
//   remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
//     return this.usersService.remove(id);
//   }
// }
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
@UseGuards(FirebaseAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
  @ApiBody({ type: CreateUserDto })
  @ApiOperation({ summary: 'Create the user (admin/moderator)' })
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.create(createUserDto, user.uid);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed database with 40 fake users' })
  @ApiResponse({ status: 201, description: 'Seeding completed successfully.' })
  async seed() {
    return await this.usersService.seedUsers();
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
  @ApiResponse({ status: 200, description: 'List of users.', type: [User] })
  @ApiOperation({ summary: 'Get all users (admin/moderator)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['email', 'created_at'] })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: UsersQuery) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile.', type: User })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findOne(user.dbId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
  @ApiResponse({ status: 200, description: 'The found user.', type: User })
  @ApiOperation({ summary: 'Get user by ID (admin/moderator)' })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
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
  @UseGuards(RolesGuard)
  @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
  @ApiOperation({ summary: 'Delete the user (admin/moderator)' })
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.remove(id);
  }
}
