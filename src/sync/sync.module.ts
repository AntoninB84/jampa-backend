import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { NoteType } from '../entities/note-type.entity';
import { Note } from '../entities/note.entity';
import { NoteCategory } from '../entities/note-category.entity';
import { Reminder } from '../entities/reminder.entity';
import { Schedule } from '../entities/schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Category,
      NoteType,
      Note,
      NoteCategory,
      Reminder,
      Schedule,
    ]),
  ],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
