import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserRole } from '../../user-roles/entities/user-role.entity';

@Entity('users')
export class User {
  @ApiProperty({ example: '8a1b2c3d-4e5f-6789-abcd-0123456789ef', description: 'UUID primary key' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'firebase:12345', description: 'Auth provider UID' })
  @Index({ unique: true })
  @Column({ name: 'provider_uid', type: 'varchar', length: 255 })
  providerUid: string;

  @ApiProperty({ example: 'Lucas', description: 'First name' })
  @Column({ name: 'first_name', type: 'varchar', length: 50, nullable: true })
  firstName: string;

  @ApiProperty({ example: 'Smith', description: 'Last name' })
  @Column({ name: 'last_name', type: 'varchar', length: 50, nullable: true })
  lastName: string;

  @ApiPropertyOptional({ example: '+380501234567' })
  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber: string;

  @ApiProperty({ example: 'user@example.com', description: 'Unique email' })
  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 254,
    transformer: { to: (v?: string) => v?.toLowerCase(), from: (v?: string) => v },
  })
  email: string;

  // added conectning to roles
  @ApiProperty({ type: () => [UserRole], description: 'User roles' })
  @OneToMany(() => UserRole, (role) => role.user, { eager: true })
  roles: UserRole[];

  @ApiProperty({ example: '2025-08-12T16:23:11.123Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ example: '2025-08-12T16:23:11.123Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
