import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { NoteType } from '../entities/note-type.entity';
import { Note } from '../entities/note.entity';
import { NoteCategory } from '../entities/note-category.entity';
import { Reminder } from '../entities/reminder.entity';
import { Schedule } from '../entities/schedule.entity';
import { SyncRequestDto } from './dto/sync.dto';
import { NoteStatusEnum } from '../entities/note.entity';

describe('SyncService', () => {
  let service: SyncService;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let noteTypeRepository: Repository<NoteType>;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockCategoryRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  const mockNoteTypeRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  const mockNoteRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  const mockNoteCategoryRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
  };

  const mockReminderRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  const mockScheduleRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        {
          provide: getRepositoryToken(NoteType),
          useValue: mockNoteTypeRepository,
        },
        {
          provide: getRepositoryToken(Note),
          useValue: mockNoteRepository,
        },
        {
          provide: getRepositoryToken(NoteCategory),
          useValue: mockNoteCategoryRepository,
        },
        {
          provide: getRepositoryToken(Reminder),
          useValue: mockReminderRepository,
        },
        {
          provide: getRepositoryToken(Schedule),
          useValue: mockScheduleRepository,
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    categoryRepository = module.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    noteTypeRepository = module.get<Repository<NoteType>>(
      getRepositoryToken(NoteType),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('synchronize', () => {
    it('should throw error if user not found', async () => {
      const userId = 'nonexistent-user';
      const syncData: SyncRequestDto = {
        categories: [],
        noteTypes: [],
        notes: [],
        reminders: [],
        schedules: [],
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.synchronize(userId, syncData)).rejects.toThrow(
        'User not found',
      );
    });

    it('should synchronize successfully with empty data', async () => {
      const userId = 'user-123';
      const user = {
        id: userId,
        email: 'test@example.com',
        lastSyncAt: null,
      };

      const syncData: SyncRequestDto = {
        categories: [],
        noteTypes: [],
        notes: [],
        reminders: [],
        schedules: [],
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({
        ...user,
        lastSyncAt: new Date(),
      });
      mockCategoryRepository.find.mockResolvedValue([]);
      mockNoteTypeRepository.find.mockResolvedValue([]);
      mockNoteRepository.find.mockResolvedValue([]);
      mockReminderRepository.find.mockResolvedValue([]);
      mockScheduleRepository.find.mockResolvedValue([]);

      const result = await service.synchronize(userId, syncData);

      expect(result).toHaveProperty('lastSyncAt');
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('noteTypes');
      expect(result).toHaveProperty('notes');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should process new categories from client', async () => {
      const userId = 'user-123';
      const user = {
        id: userId,
        email: 'test@example.com',
        lastSyncAt: null,
      };

      const syncData: SyncRequestDto = {
        categories: [
          {
            id: 'cat-1',
            name: 'Work',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        noteTypes: [],
        notes: [],
        reminders: [],
        schedules: [],
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockReturnValue({
        id: 'cat-1',
        name: 'Work',
      });
      mockCategoryRepository.save.mockResolvedValue({
        id: 'cat-1',
        name: 'Work',
      });
      mockUserRepository.save.mockResolvedValue({
        ...user,
        lastSyncAt: new Date(),
      });
      mockCategoryRepository.find.mockResolvedValue([]);
      mockNoteTypeRepository.find.mockResolvedValue([]);
      mockNoteRepository.find.mockResolvedValue([]);
      mockReminderRepository.find.mockResolvedValue([]);
      mockScheduleRepository.find.mockResolvedValue([]);

      const result = await service.synchronize(userId, syncData);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cat-1', userId },
      });
      expect(categoryRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('lastSyncAt');
    });

    it('should update existing categories from client', async () => {
      const userId = 'user-123';
      const user = {
        id: userId,
        email: 'test@example.com',
        lastSyncAt: new Date('2024-01-01T00:00:00Z'),
      };

      const existingCategory = {
        id: 'cat-1',
        name: 'Old Name',
        userId,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      const syncData: SyncRequestDto = {
        lastSyncAt: '2024-01-01T00:00:00Z',
        categories: [
          {
            id: 'cat-1',
            name: 'New Name',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
        ],
        noteTypes: [],
        notes: [],
        reminders: [],
        schedules: [],
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockCategoryRepository.findOne.mockResolvedValue(existingCategory);
      mockCategoryRepository.update.mockResolvedValue({ affected: 1 });
      mockUserRepository.save.mockResolvedValue({
        ...user,
        lastSyncAt: new Date(),
      });
      mockCategoryRepository.find.mockResolvedValue([]);
      mockNoteTypeRepository.find.mockResolvedValue([]);
      mockNoteRepository.find.mockResolvedValue([]);
      mockReminderRepository.find.mockResolvedValue([]);
      mockScheduleRepository.find.mockResolvedValue([]);

      const result = await service.synchronize(userId, syncData);

      expect(categoryRepository.update).toHaveBeenCalled();
      expect(result).toHaveProperty('lastSyncAt');
    });

    it('should process new note types from client', async () => {
      const userId = 'user-123';
      const user = {
        id: userId,
        email: 'test@example.com',
        lastSyncAt: null,
      };

      const syncData: SyncRequestDto = {
        categories: [],
        noteTypes: [
          {
            id: 'type-1',
            name: 'Task',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        notes: [],
        reminders: [],
        schedules: [],
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockNoteTypeRepository.findOne.mockResolvedValue(null);
      mockNoteTypeRepository.create.mockReturnValue({
        id: 'type-1',
        name: 'Task',
      });
      mockNoteTypeRepository.save.mockResolvedValue({
        id: 'type-1',
        name: 'Task',
      });
      mockUserRepository.save.mockResolvedValue({
        ...user,
        lastSyncAt: new Date(),
      });
      mockCategoryRepository.find.mockResolvedValue([]);
      mockNoteTypeRepository.find.mockResolvedValue([]);
      mockNoteRepository.find.mockResolvedValue([]);
      mockReminderRepository.find.mockResolvedValue([]);
      mockScheduleRepository.find.mockResolvedValue([]);

      const result = await service.synchronize(userId, syncData);

      expect(noteTypeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'type-1', userId },
      });
      expect(noteTypeRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('lastSyncAt');
    });
  });
});
