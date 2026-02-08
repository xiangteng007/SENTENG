import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SiteLogsService } from './site-logs.service';
import { SiteLog } from './site-log.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SiteLogsService', () => {
  let service: SiteLogsService;
  let mockRepo: any;

  const mockLog: Partial<SiteLog> = {
    id: 'sl-001',
    projectId: 'proj-001',
    logDate: new Date('2025-06-01'),
    weatherAm: 'sunny',
    workersOwn: 5,
    workersSubcon: 3,
    isApproved: false,
    submittedBy: 'user-1',
    submittedAt: undefined as Date | undefined,
    approvedBy: null,
    approvedAt: undefined as Date | undefined,
    notes: 'Test log',
  };

  const mockQb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockLog], 1]),
    getMany: jest.fn().mockResolvedValue([mockLog]),
  };

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      create: jest.fn((data: any) => ({ ...data })),
      save: jest.fn((entity: any) => Promise.resolve(entity)),
      remove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(() => ({ ...mockQb })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiteLogsService,
        { provide: getRepositoryToken(SiteLog), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<SiteLogsService>(SiteLogsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findAll ───

  describe('findAll', () => {
    it('should return paginated site logs', async () => {
      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result).toEqual({ items: [mockLog], total: 1 });
    });

    it('should apply projectId filter', async () => {
      await service.findAll({ projectId: 'proj-001' });
      expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  // ─── findOne ───

  describe('findOne', () => {
    it('should return site log when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockLog);
      expect(await service.findOne('sl-001')).toEqual(mockLog);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findByDate ───

  describe('findByDate', () => {
    it('should find log by project and date', async () => {
      mockRepo.findOne.mockResolvedValue(mockLog);
      const result = await service.findByDate('proj-001', '2025-06-01');
      expect(result).toEqual(mockLog);
    });

    it('should return null when no log exists for date', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      expect(await service.findByDate('proj-001', '2025-12-25')).toBeNull();
    });
  });

  // ─── create ───

  describe('create', () => {
    it('should create a new site log', async () => {
      mockRepo.findOne.mockResolvedValue(null); // no duplicate
      const dto = { projectId: 'proj-001', logDate: '2025-06-02', weatherAm: 'rainy' };
      const result = await service.create(dto, 'user-1');
      expect(result).toBeDefined();
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if log already exists for date', async () => {
      mockRepo.findOne.mockResolvedValue(mockLog); // duplicate exists
      const dto = { projectId: 'proj-001', logDate: '2025-06-01' };
      await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── update ───

  describe('update', () => {
    it('should update a non-approved site log', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockLog, isApproved: false });
      const result = await service.update('sl-001', { notes: 'updated' });
      expect(result.notes).toBe('updated');
    });

    it('should throw BadRequestException for approved logs', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockLog, isApproved: true });
      await expect(service.update('sl-001', { notes: 'cloudy' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── submit ───

  describe('submit', () => {
    it('should set submittedBy and submittedAt', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockLog });
      const result = await service.submit('sl-001', 'user-1');
      expect(result.submittedBy).toBe('user-1');
      expect(result.submittedAt).toBeInstanceOf(Date);
    });
  });

  // ─── approve ───

  describe('approve', () => {
    it('should approve a submitted log', async () => {
      mockRepo.findOne.mockResolvedValue({
        ...mockLog,
        submittedAt: new Date(),
      });
      const result = await service.approve('sl-001', 'supervisor-1');
      expect(result.isApproved).toBe(true);
      expect(result.approvedBy).toBe('supervisor-1');
    });

    it('should throw BadRequestException for unsubmitted logs', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockLog, submittedAt: null });
      await expect(service.approve('sl-001', 'supervisor-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── reject ───

  describe('reject', () => {
    it('should reset approval and append rejection reason', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockLog, isApproved: true, notes: 'existing' });
      const result = await service.reject('sl-001', 'Missing photos');
      expect(result.isApproved).toBe(false);
      expect(result.notes).toContain('[REJECTED]');
      expect(result.notes).toContain('Missing photos');
    });
  });

  // ─── getProjectSummary ───

  describe('getProjectSummary', () => {
    it('should return summary statistics', async () => {
      const result = await service.getProjectSummary('proj-001');
      expect(result).toHaveProperty('totalDays');
      expect(result).toHaveProperty('approvedDays');
      expect(result).toHaveProperty('totalWorkers');
      expect(result).toHaveProperty('avgWorkersPerDay');
    });
  });

  // ─── remove ───

  describe('remove', () => {
    it('should remove a non-approved log', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockLog, isApproved: false });
      await service.remove('sl-001');
      expect(mockRepo.remove).toHaveBeenCalled();
    });

    it('should throw BadRequestException for approved logs', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockLog, isApproved: true });
      await expect(service.remove('sl-001')).rejects.toThrow(BadRequestException);
    });
  });
});
