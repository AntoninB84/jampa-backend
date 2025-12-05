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
import { User } from './user.entity';
import { NoteType } from './note-type.entity';
import { NoteCategory } from './note-category.entity';
import { Schedule } from './schedule.entity';

export enum NoteStatusEnum {
  TODO = 'todo',
  DONE = 'done',
}

@Entity('notes')
export class Note {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.notes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'note_type_id', nullable: true })
  noteTypeId: string;

  @ManyToOne(() => NoteType, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'note_type_id' })
  noteType: NoteType;

  @Column({ name: 'is_important', default: false })
  isImportant: boolean;

  @Column({
    name: 'status',
    type: 'enum',
    enum: NoteStatusEnum,
    default: NoteStatusEnum.TODO,
  })
  status: NoteStatusEnum;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @OneToMany(() => NoteCategory, (noteCategory) => noteCategory.note)
  noteCategories: NoteCategory[];

  @OneToMany(() => Schedule, (schedule) => schedule.note)
  schedules: Schedule[];
}
