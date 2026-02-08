import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Mock the full transitive dependency chain before any imports that trigger it
jest.mock('../../core', () => ({}));
jest.mock('../../core/core.module', () => ({ CoreModule: class {} }));
jest.mock('../../core/services/feature-toggle.service', () => ({
  FeatureToggleService: class {},
}));
jest.mock('../projects/projects.service', () => ({
  ProjectsService: class {},
}));
jest.mock('../contracts/contracts.service', () => ({
  ContractsService: class {},
}));

import { ChangeOrdersService } from './change-orders.service';
import { ChangeOrder, ChangeOrderItem } from './change-order.entity';
import { ContractsService } from '../contracts/contracts.service';
describe('ChangeOrdersService', () => {
  let service: ChangeOrdersService;
  let mockCoRepo: any;
  let mockItemsRepo: any;
  let mockContractsService: any;

  const mockCo: Partial<ChangeOrder> = {
    id: 'CO-202501-0001',
    contractId: 'ctr-001',
    projectId: 'proj-001',
    coNumber: 'CO-001',
    title: 'Extra foundation work',
    reason: 'Soil conditions',
    amount: 150000 as any,
    daysImpact: 5,
    status: 'CO_DRAFT',
    createdAt: new Date(),
  };

  const mockContract = {
    id: 'ctr-001',
    projectId: 'proj-001',
    status: 'CTR_ACTIVE',
    originalAmount: 1000000,
    changeAmount: 0,
  };

  beforeEach(async () => {
    mockCoRepo = {
      find: jest.fn().mockResolvedValue([mockCo]),
      findOne: jest.fn(),
      create: jest.fn((data: any) => ({ ...data })),
      save: jest.fn((entity: any) => Promise.resolve(entity)),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      })),
    };

    mockItemsRepo = {
      save: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockContractsService = {
      findOne: jest.fn().mockResolvedValue(mockContract),
      update: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeOrdersService,
        { provide: getRepositoryToken(ChangeOrder), useValue: mockCoRepo },
        { provide: getRepositoryToken(ChangeOrderItem), useValue: mockItemsRepo },
        { provide: ContractsService, useValue: mockContractsService },
      ],
    }).compile();

    service = module.get<ChangeOrdersService>(ChangeOrdersService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findAll ───

  describe('findAll', () => {
    it('should return all change orders', async () => {
      const result = await service.findAll({});
      expect(result).toEqual([mockCo]);
    });

    it('should filter by contractId', async () => {
      await service.findAll({ contractId: 'ctr-001' });
      expect(mockCoRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ contractId: 'ctr-001' }),
        }),
      );
    });

    it('should filter by status', async () => {
      await service.findAll({ status: 'CO_DRAFT' });
      expect(mockCoRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'CO_DRAFT' }),
        }),
      );
    });
  });

  // ─── findOne ───

  describe('findOne', () => {
    it('should return change order when found', async () => {
      mockCoRepo.findOne.mockResolvedValue(mockCo);
      expect(await service.findOne('CO-202501-0001')).toEqual(mockCo);
    });

    it('should throw NotFoundException when not found', async () => {
      mockCoRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ───

  describe('create', () => {
    it('should create change order for active contract', async () => {
      mockCoRepo.findOne.mockResolvedValue({ ...mockCo, id: 'CO-202501-0001' });

      const dto = {
        contractId: 'ctr-001',
        title: 'New CO',
        reason: 'Change',
        items: [
          { itemName: 'Foundation', description: 'Item 1', quantity: 10, unitPrice: 1000, unit: 'unit' },
        ],
      };

      const result = await service.create(dto, 'user-1');
      expect(result).toBeDefined();
      expect(mockContractsService.findOne).toHaveBeenCalledWith('ctr-001');
    });

    it('should reject creation for inactive contracts', async () => {
      mockContractsService.findOne.mockResolvedValue({
        ...mockContract,
        status: 'CTR_CLOSED',
      });

      await expect(
        service.create({ contractId: 'ctr-001', title: 'X', reason: 'Y' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── update ───

  describe('update', () => {
    it('should update draft change order', async () => {
      mockCoRepo.findOne.mockResolvedValue({ ...mockCo, status: 'CO_DRAFT' });
      const result = await service.update('CO-202501-0001', { title: 'Updated' });
      expect(result).toBeDefined();
    });

    it('should reject update for non-draft', async () => {
      mockCoRepo.findOne.mockResolvedValue({ ...mockCo, status: 'CO_PENDING' });
      await expect(
        service.update('CO-202501-0001', { title: 'Updated' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── submit ───

  describe('submit', () => {
    it('should change status from DRAFT to PENDING', async () => {
      mockCoRepo.findOne.mockResolvedValue({ ...mockCo, status: 'CO_DRAFT' });
      const result = await service.submit('CO-202501-0001');
      expect(result.status).toBe('CO_PENDING');
    });

    it('should reject submit for non-draft', async () => {
      mockCoRepo.findOne.mockResolvedValue({ ...mockCo, status: 'CO_APPROVED' });
      await expect(service.submit('CO-202501-0001')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── approve ───

  describe('approve', () => {
    it('should approve a pending change order', async () => {
      mockCoRepo.findOne.mockResolvedValue({ ...mockCo, status: 'CO_PENDING' });
      const result = await service.approve('CO-202501-0001', 'approver-1');
      expect(result.status).toBe('CO_APPROVED');
      expect(result.approvedAt).toBeInstanceOf(Date);
      expect(result.approvedBy).toBe('approver-1');
    });

    it('should reject approval for non-pending', async () => {
      mockCoRepo.findOne.mockResolvedValue({ ...mockCo, status: 'CO_DRAFT' });
      await expect(service.approve('CO-202501-0001')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── reject ───

  describe('reject', () => {
    it('should reject and revert to draft', async () => {
      mockCoRepo.findOne.mockResolvedValue({ ...mockCo, status: 'CO_PENDING', notes: '' });
      const result = await service.reject('CO-202501-0001', 'Missing docs');
      expect(result.status).toBe('CO_DRAFT');
      expect(result.notes).toContain('[駁回]');
    });

    it('should throw for non-pending', async () => {
      mockCoRepo.findOne.mockResolvedValue({ ...mockCo, status: 'CO_DRAFT' });
      await expect(
        service.reject('CO-202501-0001', 'reason'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
