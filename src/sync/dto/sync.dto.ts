import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  IsUUID,
  IsInt,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { ReminderOffsetType } from '../../entities/reminder.entity';
import { RecurrenceType } from '../../entities/schedule.entity';
import { NoteStatusEnum } from '../../entities/note.entity';

export class SyncCategoryDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;

  @IsOptional()
  @IsDateString()
  deletedAt?: string;
}

export class SyncNoteTypeDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;

  @IsOptional()
  @IsDateString()
  deletedAt?: string;
}

export class SyncNoteDto {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUUID()
  noteTypeId?: string;

  @IsBoolean()
  isImportant: boolean;

  @IsEnum(NoteStatusEnum)
  status: NoteStatusEnum;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;

  @IsOptional()
  @IsDateString()
  deletedAt?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryIds?: string[];
}

export class SyncReminderDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsUUID()
  scheduleId?: string;

  @IsOptional()
  @IsInt()
  offsetValue?: number;

  @IsOptional()
  @IsEnum(ReminderOffsetType)
  offsetType?: ReminderOffsetType;

  @IsBoolean()
  isNotification: boolean;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;

  @IsOptional()
  @IsDateString()
  deletedAt?: string;
}

export class SyncScheduleDto {
  @IsUUID()
  id: string;

  @IsUUID()
  noteId: string;

  @IsOptional()
  @IsDateString()
  startDateTime?: string;

  @IsOptional()
  @IsDateString()
  endDateTime?: string;

  @IsOptional()
  @IsDateString()
  recurrenceEndDate?: string;

  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;

  @IsOptional()
  @IsInt()
  recurrenceInterval?: number;

  @IsOptional()
  @IsInt()
  recurrenceDay?: number;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;

  @IsOptional()
  @IsDateString()
  deletedAt?: string;
}

export class SyncRequestDto {
  @IsOptional()
  @IsDateString()
  lastSyncAt?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncCategoryDto)
  categories?: SyncCategoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncNoteTypeDto)
  noteTypes?: SyncNoteTypeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncNoteDto)
  notes?: SyncNoteDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncReminderDto)
  reminders?: SyncReminderDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncScheduleDto)
  schedules?: SyncScheduleDto[];
}
