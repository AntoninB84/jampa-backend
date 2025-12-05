import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Note } from './note.entity';
import { Category } from './category.entity';

@Entity('note_categories')
export class NoteCategory {
  @PrimaryColumn({ name: 'note_id' })
  noteId: string;

  @PrimaryColumn({ name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => Note, (note) => note.noteCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'note_id' })
  note: Note;

  @ManyToOne(() => Category, (category) => category.noteCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
