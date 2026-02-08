import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CostEntriesService } from './cost-entries.service';
import { CostEntry } from './cost-entry.entity';
import { FinanceService } from '../finance/finance.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('CostEntriesService', () => {
  let service: CostEntriesService;
  let mockRepo: any;
  let mockFinanceService: any;

  const mockEntry: Partial<CostEntry> = {
    id: 'COST-202501-0001',
    projectId: 'proj-001',
    category: '工資',
    description: 'Worker wages',
    amount: 50000 as any,
    isPaid: false,
    entryDate: new Date('2025-01-15'),
    project: { createdBy: 'user-1' } as any,
  };

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn().mockResolvedValue([mockEntry]),
      findOne: jest.fn(),
      create: jest.fn((data: any) => ({ ...data })),
      save: jest.fn((entity: any) => Promise.resolve(entity)),
      remove: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      })),
    };

    mockFinanceService = {
      createTransactionFromSource: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostEntriesService,
        { provide: getRepositoryToken(CostEntry), useValue: mockRepo },
        { provide: FinanceService, useValue: mockFinanceService },
      ],
    }).compile();

    service = module.get<CostEntriesService>(CostEntriesService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findAll ───

  describe('findAll', () => {
    it('should return all entries for admin', async () => {
      const result = await service.findAll({}, 'admin-1', 'admin');
      expect(result).toEqual([mockEntry]);
    });

    it('should filter by ownership for non-admin', async () => {
      mockRepo.find.mockResolvedValue([
        { ...mockEntry, project: { createdBy: 'user-1' } },
        { ...mockEntry, id: 'other', project: { createdBy: 'user-2' } },
      ]);
      const result = await service.findAll({}, 'user-1', 'user');
      expect(result).toHaveLength(1);
    });

    it('should apply filter options', async () => {
      await service.findAll({
        projectId: 'proj-001',
        category: '工資',
        isPaid: false,
      });
      expect(mockRepo.find).toHaveBeenCalled();
    });
  });

  // ─── findOne ───

  describe('findOne', () => {
    it('should return entry when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockEntry);
      expect(await service.findOne('COST-202501-0001')).toEqual(mockEntry);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner', async () => {
      mockRepo.findOne.mockResolvedValue(mockEntry);
      await expect(
        service.findOne('COST-202501-0001', 'other-user', 'user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin access', async () => {
      mockRepo.findOne.mockResolvedValue(mockEntry);
      const result = await service.findOne('COST-202501-0001', 'admin-1', 'admin');
      expect(result).toEqual(mockEntry);
    });
  });

  // ─── getSummary ───

  describe('getSummary', () => {
    it('should aggregate cost summary by category', async () => {
      mockRepo.find.mockResolvedValue([
        { ...mockEntry, amount: 10000, isPaid: true, category: '工資' },
        { ...mockEntry, amount: 5000, isPaid: false, category: '材料' },
      ]);

      const result = await service.getSummary('proj-001');
      expect(result.projectId).toBe('proj-001');
      expect(result.totalCost).toBe(15000);
      expect(result.paidCost).toBe(10000);
      expect(result.unpaidCost).toBe(5000);
      expect(result.entryCount).toBe(2);
      expect(result.byCategory).toHaveProperty('工資');
      expect(result.byCategory).toHaveProperty('材料');
    });
  });

  // ─── create ───

  describe('create', () => {
    it('should create with generated ID', async () => {
      const dto = {
        projectId: 'proj-001',
        category: '工資',
        amount: 50000,
        entryDate: '2025-01-15',
        description: 'Test',
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(mockRepo.create).toHaveBeenCalled();
    });
  });

  // ─── update ───

  describe('update', () => {
    it('should update entry fields', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockEntry });
      const result = await service.update('COST-202501-0001', {
        description: 'Updated',
      });
      expect(result.description).toBe('Updated');
    });
  });

  // ─── markPaid ───

  describe('markPaid', () => {
    it('should mark entry as paid and create finance transaction', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockEntry });

      const result = await service.markPaid(
        'COST-202501-0001',
        { paymentMethod: 'CASH' },
        'user-1',
      );

      expect(result.isPaid).toBe(true);
      expect(result.paymentMethod).toBe('CASH');
      expect(mockFinanceService.createTransactionFromSource).toHaveBeenCalledWith(
        expect.objectContaining({
          type: '支出',
          referenceType: 'COST_ENTRY',
        }),
      );
    });
  });

  // ─── delete ───

  describe('delete', () => {
    it('should remove cost entry', async () => {
      mockRepo.findOne.mockResolvedValue(mockEntry);
      await service.delete('COST-202501-0001');
      expect(mockRepo.remove).toHaveBeenCalledWith(mockEntry);
    });
  });
});
