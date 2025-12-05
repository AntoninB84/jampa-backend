import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncRequestDto } from './dto/sync.dto';

describe('SyncController', () => {
  let controller: SyncController;
  let service: SyncService;

  const mockSyncService = {
    synchronize: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncService,
          useValue: mockSyncService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<SyncController>(SyncController);
    service = module.get<SyncService>(SyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('synchronize', () => {
    it('should synchronize data successfully', async () => {
      const userId = 'user-123';
      const syncData: SyncRequestDto = {
        lastSyncAt: '2024-01-01T00:00:00Z',
        categories: [],
        noteTypes: [],
        notes: [],
        reminders: [],
        schedules: [],
      };

      const expectedResult = {
        lastSyncAt: new Date('2024-01-02T00:00:00Z'),
        categories: [],
        noteTypes: [],
        notes: [],
        reminders: [],
        schedules: [],
      };

      mockSyncService.synchronize.mockResolvedValue(expectedResult);

      const req = { user: { userId } };
      const result = await controller.synchronize(req, syncData);

      expect(result).toEqual(expectedResult);
      expect(service.synchronize).toHaveBeenCalledWith(userId, syncData);
      expect(service.synchronize).toHaveBeenCalledTimes(1);
    });

    it('should handle sync with new data from client', async () => {
      const userId = 'user-123';
      const syncData: SyncRequestDto = {
        lastSyncAt: '2024-01-01T00:00:00Z',
        categories: [
          {
            id: 'cat-1',
            name: 'Work',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
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

      const expectedResult = {
        lastSyncAt: new Date('2024-01-02T00:00:00Z'),
        categories: [],
        noteTypes: [],
        notes: [],
        reminders: [],
        schedules: [],
      };

      mockSyncService.synchronize.mockResolvedValue(expectedResult);

      const req = { user: { userId } };
      const result = await controller.synchronize(req, syncData);

      expect(result).toEqual(expectedResult);
      expect(service.synchronize).toHaveBeenCalledWith(userId, syncData);
    });

    it('should handle sync without lastSyncAt (first sync)', async () => {
      const userId = 'user-123';
      const syncData: SyncRequestDto = {
        categories: [],
        noteTypes: [],
        notes: [],
        reminders: [],
        schedules: [],
      };

      const expectedResult = {
        lastSyncAt: new Date('2024-01-02T00:00:00Z'),
        categories: [],
        noteTypes: [],
        notes: [],
        reminders: [],
        schedules: [],
      };

      mockSyncService.synchronize.mockResolvedValue(expectedResult);

      const req = { user: { userId } };
      const result = await controller.synchronize(req, syncData);

      expect(result).toEqual(expectedResult);
      expect(service.synchronize).toHaveBeenCalledWith(userId, syncData);
    });
  });
});
