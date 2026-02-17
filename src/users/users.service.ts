import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { normalizeEmail } from 'src/common/utils/normalize.util';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';

import { UserRole } from '../user-roles/entities/user-role.entity';
import { ERole } from '../user-roles/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { ECropType, EGrowthStatus } from '../users/enums/user-crop.enum';
interface IUsersQuery {
  page?: number;
  limit?: number;
  name?: string;
  role?: ERole;
  hasPhone?: boolean;
  cropType?: ECropType;
  status?: EGrowthStatus;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly rolesRepository: Repository<UserRole>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async findByProviderUid(providerUid: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { providerUid },
      relations: ['roles'],
    });
  }

  async createFromFirebaseToken(decodedToken: admin.auth.DecodedIdToken): Promise<User> {
    const fullName: string = typeof decodedToken.name === 'string' ? decodedToken.name : '';
    const nameParts = fullName.split(' ');

    const user = this.usersRepository.create({
      providerUid: decodedToken.uid,
      email: decodedToken.email?.toLowerCase(),
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
    });

    try {
      const savedUser = await this.usersRepository.save(user);

      const userRole = this.rolesRepository.create({
        userId: savedUser.id,
        role: ERole.GUEST,
      });
      await this.rolesRepository.save(userRole);

      const result = await this.findByProviderUid(savedUser.providerUid);

      if (!result) {
        throw new Error('Failed to retrieve user after creation');
      }

      return result;
    } catch (err: unknown) {
      const error = err as { code?: string };

      if (error.code === '23505') {
        const existing = await this.findByProviderUid(decodedToken.uid);

        if (existing) {
          return existing;
        }
      }

      throw err;
    }
  }

  async create(createUserDto: CreateUserDto, providerUid: string): Promise<User> {
    const user = this.usersRepository.create({
      providerUid,
      email: createUserDto.email.toLowerCase(),
      firstName: createUserDto.firstName || '',
      lastName: createUserDto.lastName || '',
      phoneNumber: createUserDto.phoneNumber,
    });

    try {
      const savedUser = await this.usersRepository.save(user);

      if (createUserDto.role) {
        const userRole = this.rolesRepository.create({
          userId: savedUser.id,
          role: createUserDto.role,
        });
        await this.rolesRepository.save(userRole);
      }

      return await this.findOne(savedUser.id);
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === '23505') {
        throw new BadRequestException('Email or Provider UID already in use.');
      }

      throw err;
    }
  }

  async findAll(query: IUsersQuery) {
    // added cropType and status
    const {
      page = 1,
      limit = 10,
      name,
      role,
      hasPhone,
      cropType,
      status,
      sortBy = 'createdAt',
      order = 'DESC',
    } = query;

    const skip = (page - 1) * limit;
    const queryBuilder = this.usersRepository.createQueryBuilder('user');
    queryBuilder.leftJoinAndSelect('user.roles', 'roles');

    //type of filter
    if (cropType) {
      queryBuilder.andWhere('user.cropType = :cropType', { cropType });
    }

    // status filter
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (name) {
      queryBuilder.andWhere(
        '(user.email ILIKE :name OR user.firstName ILIKE :name OR user.lastName ILIKE :name)',
        { name: `%${name}%` },
      );
    }

    if (role) {
      queryBuilder.andWhere('roles.role = :role', { role });
    }

    if (hasPhone !== undefined) {
      if (String(hasPhone) === 'true') {
        queryBuilder.andWhere('user.phoneNumber IS NOT NULL AND user.phoneNumber != :empty', {
          empty: '',
        });
      } else {
        queryBuilder.andWhere('(user.phoneNumber IS NULL OR user.phoneNumber = :empty)', {
          empty: '',
        });
      }
    }

    const fieldOnly = sortBy.includes('.') ? sortBy.split('.').pop() : sortBy;

    // validate fields
    const validFields = [
      'id',
      'email',
      'firstName',
      'lastName',
      'createdAt',
      'phoneNumber',
      'cropType',
      'status',
      'totalGrowthDays',
      'growthDay',
    ];

    const finalSortField = validFields.includes(fieldOnly || '') ? fieldOnly : 'createdAt';

    queryBuilder.orderBy(`user.${finalSortField}`, order).skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: Number(page),
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { email, role, ...rest } = updateUserDto;
    const updateData: Partial<User> = { ...rest };

    if (email) {
      updateData.email = normalizeEmail(email);
    }

    const entity = await this.usersRepository.preload({ id, ...updateData });

    if (!entity) {
      throw new NotFoundException('User not found.');
    }

    try {
      await this.usersRepository.save(entity);

      if (role) {
        await this.rolesRepository.upsert({ userId: id, role: role }, ['userId']);
      }

      return await this.findOne(id);
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === '23505') {
        throw new BadRequestException('Email already in use.');
      }

      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    try {
      if (user.providerUid && !user.providerUid.startsWith('mock-')) {
        await this.firebaseService.deleteUser(user.providerUid);
      }
    } catch (error) {
      console.error('Firebase delete failed, continuing with DB removal', error);
    }

    await this.usersRepository.delete(id);
  }

  async seedUsers() {
    const { faker } = await import('@faker-js/faker');

    for (let i = 0; i < 40; i++) {
      let role: ERole = ERole.GUEST;

      if (i === 0) {
        role = ERole.SUPERADMIN;
      } else if (i % 5 === 0) {
        role = ERole.MODERATOR;
      }

      const dto: CreateUserDto = {
        email: faker.internet.email().toLowerCase(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phoneNumber: `+380${faker.string.numeric(9)}`,
        role: role,
      };

      const mockUid = `mock-${faker.string.alphanumeric(15)}`;
      await this.create(dto, mockUid);
    }

    return { message: 'Seed completed: 40 users added.' };
  }
}
