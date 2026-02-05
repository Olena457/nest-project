import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { DecodedIdToken } from 'firebase-admin/auth';

import { User as CurrentUser } from '../auth/decorators/user.decorator';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { ERole } from '../user-roles/enums/role.enum';
import { Roles } from '../user-roles/user-roles.decorator';
import { RolesGuard } from '../user-roles/user-roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Core: Users')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiExcludeEndpoint()
  @ApiBody({ type: CreateUserDto })
  @ApiOperation({ summary: 'Create the user' })
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: DecodedIdToken) {
    return this.usersService.create(createUserDto, user.uid);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
  @ApiResponse({ status: 200, description: 'List of users.', type: [User] })
  @ApiOperation({ summary: 'Get all users (admin)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
  @ApiResponse({ status: 200, description: 'The found user.', type: User })
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
  @ApiBody({ type: UpdateUserDto })
  @ApiOperation({ summary: 'Update the user (admin)' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(ERole.SUPERADMIN, ERole.MODERATOR)
  @ApiOperation({ summary: 'Delete the user (admin)' })
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.usersService.remove(id);
  }
}
