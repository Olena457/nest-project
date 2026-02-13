import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ECropType, EGrowthStatus } from '../enums/user-crop.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ValueTransformer,
} from 'typeorm';

import { UserRole } from '../../user-roles/entities/user-role.entity';

const lowercaseTransformer: ValueTransformer = {
  to: (v: string | undefined): string | undefined => v?.toLowerCase(),
  from: (v: string | undefined): string | undefined => v,
};

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
  firstName: string | null;

  @ApiProperty({ example: 'Smith', description: 'Last name' })
  @Column({ name: 'last_name', type: 'varchar', length: 50, nullable: true })
  lastName: string | null;

  @ApiPropertyOptional({ example: '+380501234567' })
  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ example: 'user@example.com', description: 'Unique email' })
  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 254,
    transformer: lowercaseTransformer,
  })
  email: string;

  @ApiProperty({ type: () => [UserRole], description: 'User roles' })
  @OneToMany(() => UserRole, (userRole) => userRole.user, { eager: true, cascade: true })
  roles: UserRole[];

  @ApiProperty({ example: '2025-08-12T16:23:11.123Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ example: '2025-08-12T16:23:11.123Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  //added crop properties

  @Column({ name: 'crop_type', type: 'enum', enum: ECropType, nullable: true })
  cropType: ECropType | null;

  @Column({ name: 'status', type: 'enum', enum: EGrowthStatus, default: EGrowthStatus.SETUP })
  status: EGrowthStatus;

  @Column({ name: 'growth_day', type: 'int', default: 0 })
  growthDay: number;

  @Column({ name: 'total_growth_days', type: 'int', default: 0 })
  totalGrowthDays: number;
}
