import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Note } from './note.entity';
import { Category } from './category.entity';
import { NoteType } from './note-type.entity';
import { Reminder } from './reminder.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true })
  username: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_sync_at', type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken: string;

  @OneToMany(() => Note, (note) => note.user)
  notes: Note[];

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @OneToMany(() => NoteType, (noteType) => noteType.user)
  noteTypes: NoteType[];

  @OneToMany(() => Reminder, (reminder) => reminder.user)
  reminders: Reminder[];
}
