import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In, IsNull } from 'typeorm';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { NoteType } from '../entities/note-type.entity';
import { Note } from '../entities/note.entity';
import { NoteCategory } from '../entities/note-category.entity';
import { Reminder } from '../entities/reminder.entity';
import { Schedule } from '../entities/schedule.entity';
import { SyncRequestDto } from './dto/sync.dto';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(NoteType)
    private noteTypeRepository: Repository<NoteType>,
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
    @InjectRepository(NoteCategory)
    private noteCategoryRepository: Repository<NoteCategory>,
    @InjectRepository(Reminder)
    private reminderRepository: Repository<Reminder>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
  ) {}

  async synchronize(userId: string, syncData: SyncRequestDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const lastSyncAt = syncData.lastSyncAt
      ? new Date(syncData.lastSyncAt)
      : null;

    // Process incoming data from client
    await this.processClientData(userId, syncData);

    // Get server changes since last sync
    const serverChanges = await this.getServerChanges(userId, lastSyncAt);

    // Update user's last sync time
    user.lastSyncAt = new Date();
    await this.userRepository.save(user);

    return {
      lastSyncAt: user.lastSyncAt,
      ...serverChanges,
    };
  }

  private async processClientData(userId: string, syncData: SyncRequestDto) {
    // Process note types
    if (syncData.noteTypes && syncData.noteTypes.length > 0) {
      for (const noteTypeDto of syncData.noteTypes) {
        const existing = await this.noteTypeRepository.findOne({
          where: { id: noteTypeDto.id, userId },
        });

        const noteTypeData: Partial<NoteType> = {
          id: noteTypeDto.id,
          name: noteTypeDto.name,
          userId,
          createdAt: new Date(noteTypeDto.createdAt),
          updatedAt: new Date(noteTypeDto.updatedAt),
        };

        if (noteTypeDto.deletedAt) {
          noteTypeData.deletedAt = new Date(noteTypeDto.deletedAt);
        }

        if (existing) {
          if (new Date(noteTypeDto.updatedAt) > new Date(existing.updatedAt)) {
            await this.noteTypeRepository.update(
              { id: noteTypeDto.id },
              noteTypeData,
            );
          }
        } else {
          await this.noteTypeRepository.save(
            this.noteTypeRepository.create(noteTypeData),
          );
        }
      }
    }

    // Process categories
    if (syncData.categories && syncData.categories.length > 0) {
      for (const categoryDto of syncData.categories) {
        const existing = await this.categoryRepository.findOne({
          where: { id: categoryDto.id, userId },
        });

        const categoryData: Partial<Category> = {
          id: categoryDto.id,
          name: categoryDto.name,
          userId,
          createdAt: new Date(categoryDto.createdAt),
          updatedAt: new Date(categoryDto.updatedAt),
        };

        if (categoryDto.deletedAt) {
          categoryData.deletedAt = new Date(categoryDto.deletedAt);
        }

        if (existing) {
          // Update if client version is newer
          if (new Date(categoryDto.updatedAt) > new Date(existing.updatedAt)) {
            await this.categoryRepository.update(
              { id: categoryDto.id },
              categoryData,
            );
          }
        } else {
          await this.categoryRepository.save(
            this.categoryRepository.create(categoryData),
          );
        }
      }
    }

    // Process schedules first (as reminders may reference them)
    if (syncData.schedules && syncData.schedules.length > 0) {
      for (const scheduleDto of syncData.schedules) {
        const existing = await this.scheduleRepository.findOne({
          where: { id: scheduleDto.id },
        });

        const scheduleData: Partial<Schedule> = {
          id: scheduleDto.id,
          noteId: scheduleDto.noteId,
          recurrenceType: scheduleDto.recurrenceType,
          recurrenceInterval: scheduleDto.recurrenceInterval,
          recurrenceDay: scheduleDto.recurrenceDay,
          createdAt: new Date(scheduleDto.createdAt),
          updatedAt: new Date(scheduleDto.updatedAt),
        };

        if (scheduleDto.startDateTime) {
          scheduleData.startDateTime = new Date(scheduleDto.startDateTime);
        }
        if (scheduleDto.endDateTime) {
          scheduleData.endDateTime = new Date(scheduleDto.endDateTime);
        }
        if (scheduleDto.recurrenceEndDate) {
          scheduleData.recurrenceEndDate = new Date(
            scheduleDto.recurrenceEndDate,
          );
        }
        if (scheduleDto.deletedAt) {
          scheduleData.deletedAt = new Date(scheduleDto.deletedAt);
        }

        if (existing) {
          if (new Date(scheduleDto.updatedAt) > new Date(existing.updatedAt)) {
            await this.scheduleRepository.update(
              { id: scheduleDto.id },
              scheduleData,
            );
          }
        } else {
          await this.scheduleRepository.save(
            this.scheduleRepository.create(scheduleData),
          );
        }
      }
    }

    // Process notes
    if (syncData.notes && syncData.notes.length > 0) {
      for (const noteDto of syncData.notes) {
        const existing = await this.noteRepository.findOne({
          where: { id: noteDto.id, userId },
        });

        const noteData: Partial<Note> = {
          id: noteDto.id,
          title: noteDto.title,
          content: noteDto.content,
          userId,
          noteTypeId: noteDto.noteTypeId,
          isImportant: noteDto.isImportant,
          status: noteDto.status,
          createdAt: new Date(noteDto.createdAt),
          updatedAt: new Date(noteDto.updatedAt),
        };

        if (noteDto.deletedAt) {
          noteData.deletedAt = new Date(noteDto.deletedAt);
        }

        if (existing) {
          if (new Date(noteDto.updatedAt) > new Date(existing.updatedAt)) {
            await this.noteRepository.update({ id: noteDto.id }, noteData);
          }
        } else {
          await this.noteRepository.save(this.noteRepository.create(noteData));
        }

        // Handle note-category relationships
        if (noteDto.categoryIds) {
          // Remove old associations
          await this.noteCategoryRepository.delete({ noteId: noteDto.id });

          // Add new associations
          for (const categoryId of noteDto.categoryIds) {
            await this.noteCategoryRepository.save(
              this.noteCategoryRepository.create({
                noteId: noteDto.id,
                categoryId,
              }),
            );
          }
        }
      }
    }

    // Process reminders
    if (syncData.reminders && syncData.reminders.length > 0) {
      for (const reminderDto of syncData.reminders) {
        const existing = await this.reminderRepository.findOne({
          where: { id: reminderDto.id, userId },
        });

        const reminderData: Partial<Reminder> = {
          id: reminderDto.id,
          userId,
          scheduleId: reminderDto.scheduleId,
          offsetValue: reminderDto.offsetValue,
          offsetType: reminderDto.offsetType,
          isNotification: reminderDto.isNotification,
          createdAt: new Date(reminderDto.createdAt),
          updatedAt: new Date(reminderDto.updatedAt),
        };

        if (reminderDto.deletedAt) {
          reminderData.deletedAt = new Date(reminderDto.deletedAt);
        }

        if (existing) {
          if (new Date(reminderDto.updatedAt) > new Date(existing.updatedAt)) {
            await this.reminderRepository.update(
              { id: reminderDto.id },
              reminderData,
            );
          }
        } else {
          await this.reminderRepository.save(
            this.reminderRepository.create(reminderData),
          );
        }
      }
    }
  }

  private async getServerChanges(userId: string, lastSyncAt: Date | null) {
    const whereCondition = lastSyncAt
      ? { userId, updatedAt: MoreThan(lastSyncAt) }
      : { userId };

    // Get system note types (userId is null for system types)
    const systemNoteTypes = await this.noteTypeRepository.find({
      where: { userId: IsNull() },
    });

    // Get user's custom note types
    const userNoteTypes = await this.noteTypeRepository.find({
      where: lastSyncAt
        ? { userId, updatedAt: MoreThan(lastSyncAt) }
        : { userId },
    });

    const noteTypes = [...systemNoteTypes, ...userNoteTypes];

    // Get categories
    const categories = await this.categoryRepository.find({
      where: whereCondition,
    });

    // Get notes
    const notes = await this.noteRepository.find({
      where: whereCondition,
      relations: ['noteCategories'],
    });

    // Get reminders
    const reminders = await this.reminderRepository.find({
      where: whereCondition,
    });

    // Get schedules for the user's notes
    const noteIds = notes.map((n) => n.id);
    const schedules =
      noteIds.length > 0
        ? await this.scheduleRepository.find({
            where: lastSyncAt
              ? { noteId: In(noteIds), updatedAt: MoreThan(lastSyncAt) }
              : { noteId: In(noteIds) },
          })
        : [];

    // Format response
    return {
      noteTypes: noteTypes.map((nt) => ({
        id: nt.id,
        name: nt.name,
        createdAt: nt.createdAt,
        updatedAt: nt.updatedAt,
        deletedAt: nt.deletedAt,
      })),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        deletedAt: c.deletedAt,
      })),
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        noteTypeId: n.noteTypeId,
        isImportant: n.isImportant,
        status: n.status,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        deletedAt: n.deletedAt,
        categoryIds: n.noteCategories.map((nc) => nc.categoryId),
      })),
      reminders: reminders.map((r) => ({
        id: r.id,
        scheduleId: r.scheduleId,
        offsetValue: r.offsetValue,
        offsetType: r.offsetType,
        isNotification: r.isNotification,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      })),
      schedules: schedules.map((s) => ({
        id: s.id,
        noteId: s.noteId,
        startDateTime: s.startDateTime,
        endDateTime: s.endDateTime,
        recurrenceEndDate: s.recurrenceEndDate,
        recurrenceType: s.recurrenceType,
        recurrenceInterval: s.recurrenceInterval,
        recurrenceDay: s.recurrenceDay,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        deletedAt: s.deletedAt,
      })),
    };
  }
}
