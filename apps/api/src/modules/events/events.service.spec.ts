import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { Event } from './event.entity';
import { NotFoundException } from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;
  let mockRepo: any;

  const now = new Date();
  const mockEvent: Partial<Event> = {
    id: 'evt-001',
    title: 'Site Meeting',
    description: 'Weekly coordination',
    startTime: now,
    endTime: new Date(now.getTime() + 3600_000),
    allDay: false,
    category: 'meeting',
    color: '#3b82f6',
    status: 'scheduled',
    projectId: 'proj-001',
    createdBy: 'user-1',
    reminderMinutes: 30,
  };

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn().mockResolvedValue([mockEvent]),
      findOne: jest.fn(),
      create: jest.fn((data: any) => ({ ...data })),
      save: jest.fn((entity: any) => Promise.resolve({ id: 'evt-001', ...entity })),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findAll ───

  describe('findAll', () => {
    it('should return events with no filters', async () => {
      const result = await service.findAll({});
      expect(result).toEqual([mockEvent]);
      expect(mockRepo.find).toHaveBeenCalled();
    });

    it('should apply date range filter', async () => {
      await service.findAll({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      });
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({}) }),
      );
    });

    it('should filter by projectId', async () => {
      await service.findAll({ projectId: 'proj-001' });
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'proj-001' }),
        }),
      );
    });

    it('should filter by category', async () => {
      await service.findAll({ category: 'meeting' });
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'meeting' }),
        }),
      );
    });

    it('should filter by status', async () => {
      await service.findAll({ status: 'completed' });
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'completed' }),
        }),
      );
    });
  });

  // ─── findOne ───

  describe('findOne', () => {
    it('should return event when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockEvent);
      expect(await service.findOne('evt-001')).toEqual(mockEvent);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ───

  describe('create', () => {
    it('should create event with correct data', async () => {
      const dto = {
        title: 'New Event',
        startTime: '2025-06-01T09:00:00Z',
        category: 'inspection',
      };

      const result = await service.create(dto, 'user-1');
      expect(result).toBeDefined();
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Event',
          category: 'inspection',
          createdBy: 'user-1',
        }),
      );
    });

    it('should use default values for optional fields', async () => {
      const dto = { title: 'Minimal Event', startTime: '2025-06-01T09:00:00Z' };

      await service.create(dto);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          allDay: false,
          category: 'general',
          color: '#3b82f6',
          reminderMinutes: 30,
        }),
      );
    });
  });

  // ─── update ───

  describe('update', () => {
    it('should update event fields', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockEvent });
      const result = await service.update('evt-001', { title: 'Updated' }, 'user-1');
      expect(result).toBeDefined();
    });

    it('should convert string dates to Date objects', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockEvent });
      await service.update('evt-001', { startTime: '2025-07-01T10:00:00Z' });
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  // ─── remove ───

  describe('remove', () => {
    it('should delete event', async () => {
      mockRepo.findOne.mockResolvedValue(mockEvent);
      await service.remove('evt-001');
      expect(mockRepo.remove).toHaveBeenCalledWith(mockEvent);
    });

    it('should throw NotFoundException if event missing', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── complete / cancel ───

  describe('complete', () => {
    it('should set status to completed', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockEvent });
      const result = await service.complete('evt-001', 'user-1');
      expect(result).toBeDefined();
    });
  });

  describe('cancel', () => {
    it('should set status to cancelled', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockEvent });
      const result = await service.cancel('evt-001', 'user-1');
      expect(result).toBeDefined();
    });
  });

  // ─── findByProject ───

  describe('findByProject', () => {
    it('should return events for a project', async () => {
      const result = await service.findByProject('proj-001');
      expect(result).toEqual([mockEvent]);
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-001' },
        }),
      );
    });
  });

  // ─── findToday / findUpcoming ───

  describe('findToday', () => {
    it('should query events for today', async () => {
      const result = await service.findToday();
      expect(mockRepo.find).toHaveBeenCalled();
      expect(result).toEqual([mockEvent]);
    });
  });

  describe('findUpcoming', () => {
    it('should query events for next N days', async () => {
      const result = await service.findUpcoming(14);
      expect(mockRepo.find).toHaveBeenCalled();
      expect(result).toEqual([mockEvent]);
    });

    it('should default to 7 days', async () => {
      await service.findUpcoming();
      expect(mockRepo.find).toHaveBeenCalled();
    });
  });
});
