import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Schedule } from './schedule.entity';

export enum ReminderOffsetType {
  MINUTES = 'minutes',
  HOURS = 'hours',
  DAYS = 'days',
}

@Entity('reminders')
export class Reminder {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.reminders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'schedule_id', nullable: true })
  scheduleId: string;

  @ManyToOne(() => Schedule, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @Column({ name: 'offset_value', type: 'int', nullable: true })
  offsetValue: number;

  @Column({
    name: 'offset_type',
    type: 'enum',
    enum: ReminderOffsetType,
    nullable: true,
  })
  offsetType: ReminderOffsetType;

  @Column({ name: 'is_notification', default: true })
  isNotification: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
