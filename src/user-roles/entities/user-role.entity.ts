import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { ERole } from '../enums/role.enum';

@Entity('user_roles')
@Index('uq_user_roles_user_role', ['userId', 'role'], { unique: true })
export class UserRole {
  @ApiProperty({ example: '4f0a3d2c-1b2a-4c3d-9e8f-0123456789ab' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '8a1b2c3d-...' })
  @Column({ name: 'user_id', type: 'uuid', unique: false })
  userId: string;

  @ApiProperty({ enum: ERole, example: ERole.GUEST })
  @Column({ type: 'enum', enum: ERole, default: ERole.GUEST })
  role: ERole;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ example: '2025-08-12T16:23:11.123Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ example: '2025-08-12T16:23:11.123Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
