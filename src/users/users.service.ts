import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { normalizeEmail } from 'src/common/utils/normalize.util';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker'; // Використовуємо нормальний імпорт

import { UserRole } from '../user-roles/entities/user-role.entity';
import { ERole } from '../user-roles/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

interface IUsersQuery {
  page?: number;
  limit?: number;
  name?: string;
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

  async create(createUserDto: CreateUserDto, providerUid: string): Promise<User> {
    const user = this.usersRepository.create({
      providerUid,
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
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
    const { page = 1, limit = 10, name, sortBy = 'user.created_at', order = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.usersRepository.createQueryBuilder('user');
    queryBuilder.leftJoinAndSelect('user.roles', 'roles');

    if (name) {
      queryBuilder.andWhere('user.email ILIKE :name', { name: `%${name}%` });
    }

    const sortField = sortBy.includes('.') ? sortBy : `user.${sortBy}`;
    queryBuilder.orderBy(sortField, order).skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: Number(page),
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = (await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    })) as User;

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

    const entity = (await this.usersRepository.preload({ id, ...updateData })) as User;

    if (!entity) {
      throw new NotFoundException('User not found.');
    }

    try {
      await this.usersRepository.save(entity);

      if (role) {
        await this.rolesRepository.upsert({ userId: id, role: role }, ['userId', 'role']);
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
      await this.firebaseService.deleteUser(user.providerUid);
    } catch {
      console.error('Firebase delete failed, continuing with DB removal');
    }

    await this.usersRepository.delete(id);
  }

  async seedUsers() {
    // Жодних динамічних імпортів — Faker тепер типізований через звичайний import
    for (let i = 0; i < 40; i++) {
      let role: ERole | undefined;

      if (i === 0) {
        role = ERole.SUPERADMIN;
      } else if (i % 5 === 0) {
        role = ERole.MODERATOR;
      } else if (i % 2 === 0) {
        role = ERole.GUEST;
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
