import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @ApiProperty({ example: '8a1b2c3d-4e5f-6789-abcd-0123456789ef', description: 'UUID primary key' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'firebase:12345', description: 'Auth provider UID (e.g., Firebase UID)' })
  @Index({ unique: true })
  @Column({ name: 'provider_uid', type: 'varchar', length: 255 })
  providerUid: string;

  @ApiProperty({ example: 'user@example.com', description: 'Unique email (stored lowercase)' })
  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 254,
    transformer: { to: (v?: string) => v?.toLowerCase(), from: (v?: string) => v },
  })
  email: string;

  @ApiProperty({ example: '2025-08-12T16:23:11.123Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ example: '2025-08-12T16:23:11.123Z' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
