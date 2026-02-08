// import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { normalizeEmail } from 'src/common/utils/normalize.util';
// import { FirebaseService } from 'src/firebase/firebase.service';
// import { Repository } from 'typeorm';

// import { UserRole } from '../user-roles/entities/user-role.entity';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { User } from './entities/user.entity';

// @Injectable()
// export class UsersService {
//   constructor(
//     @InjectRepository(User)
//     private readonly usersRepository: Repository<User>,
//     @InjectRepository(UserRole)
//     private readonly firebaseService: FirebaseService,
//   ) {}

//   async create(createUserDto: CreateUserDto, providerUid: string): Promise<User> {
//     const user = this.usersRepository.create({
//       providerUid,
//       email: createUserDto.email,
//     });

//     try {
//       return await this.usersRepository.save(user);
//     } catch (err: any) {
//       if (err?.code === '23505') {
//         if (err?.detail?.includes('email')) {
//           throw new BadRequestException('Email already in use.');
//         }

//         if (err?.detail?.includes('provider_uid') || err?.detail?.includes('providerUid')) {
//           throw new BadRequestException('User with this provider UID already exists.');
//         }
//       }

//       throw err;
//     }
//   }

//   async findByProviderUid(providerUid: string): Promise<User | null> {
//     return this.usersRepository.findOne({ where: { providerUid } });
//   }

//   async findByEmail(email: string): Promise<User | null> {
//     return this.usersRepository.findOne({ where: { email } });
//   }

//   async findAll(): Promise<User[]> {
//     return this.usersRepository.find();
//   }

//   async findOne(id: string): Promise<User> {
//     const user = await this.usersRepository.findOne({ where: { id } });
//     console.log('user id', id);
//     if (!user) {
//       throw new NotFoundException(`User not found ${id}.`);
//     }

//     return user;
//   }

//   async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
//     const { providerUid: _ignore, ...rest } = updateUserDto;

//     rest.email = normalizeEmail(rest.email || '');

//     const entity = await this.usersRepository.preload({ id, ...rest });
//     if (!entity) {
//       throw new NotFoundException('User not found.');
//     }

//     try {
//       return await this.usersRepository.save(entity);
//     } catch (err: any) {
//       if (err?.code === '23505') {
//         if (err?.detail?.includes('email')) {
//           throw new BadRequestException('Email already in use.');
//         }

//         if (err?.detail?.includes('provider_uid') || err?.detail?.includes('providerUid')) {
//           throw new BadRequestException('User with this provider UID already exists.');
//         }
//       }

//       throw err;
//     }
//   }

//   async remove(id: string): Promise<void> {
//     const user = await this.findOne(id);

//     try {
//       await this.firebaseService.deleteUser(user.providerUid);
//     } catch (e) {
//       console.error('Error deleting user from Firebase');
//     }

//     await this.usersRepository.delete(id);
//   }
// }
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { normalizeEmail } from 'src/common/utils/normalize.util';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Repository } from 'typeorm';

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
    private readonly firebaseService: FirebaseService,
  ) {}

  async create(createUserDto: CreateUserDto, providerUid: string): Promise<User> {
    const user = this.usersRepository.create({
      providerUid,
      email: createUserDto.email,
    });

    try {
      return await this.usersRepository.save(user);
    } catch (err: unknown) {
      const error = err as { code?: string };

      if (error.code === '23505') {
        throw new BadRequestException('Email or Provider UID already in use.');
      }

      throw err;
    }
  }

  async findAll(query: IUsersQuery) {
    const { page = 1, limit = 10, name, sortBy = 'created_at', order = 'DESC' } = query;

    const skip = (page - 1) * limit;
    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    if (name) {
      queryBuilder.andWhere('user.email ILIKE :name', { name: `%${name}%` });
    }

    queryBuilder.orderBy(`user.${sortBy}`, order).skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: Number(page),
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { email, ...rest } = updateUserDto;

    // updateData.email
    const updateData: Partial<User> = { ...rest };

    if (email) {
      updateData.email = normalizeEmail(email);
    }

    const entity = await this.usersRepository.preload({ id, ...updateData });

    if (!entity) {
      throw new NotFoundException('User not found.');
    }

    try {
      return await this.usersRepository.save(entity);
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
}
