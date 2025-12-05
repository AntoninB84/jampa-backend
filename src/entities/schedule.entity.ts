import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Note } from './note.entity';
import { Reminder } from './reminder.entity';

export enum RecurrenceType {
  INTERVAL_DAYS = 'intervalDays',
  INTERVAL_YEARS = 'intervalYears',
  DAY_BASED_WEEKLY = 'dayBasedWeekly',
  DAY_BASED_MONTHLY = 'dayBasedMonthly',
}

@Entity('schedules')
export class Schedule {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'note_id' })
  noteId: string;

  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'note_id' })
  note: Note;

  @OneToMany(() => Reminder, (reminder) => reminder.schedule)
  reminders: Reminder[];

  @Column({ name: 'start_date_time', type: 'timestamp', nullable: true })
  startDateTime: Date;

  @Column({ name: 'end_date_time', type: 'timestamp', nullable: true })
  endDateTime: Date;

  @Column({ name: 'recurrence_end_date', type: 'date', nullable: true })
  recurrenceEndDate: Date;

  @Column({
    name: 'recurrence_type',
    type: 'enum',
    enum: RecurrenceType,
    nullable: true,
  })
  recurrenceType: RecurrenceType;

  @Column({ name: 'recurrence_interval', type: 'int', nullable: true })
  recurrenceInterval: number;

  @Column({ name: 'recurrence_day', type: 'int', nullable: true })
  recurrenceDay: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
