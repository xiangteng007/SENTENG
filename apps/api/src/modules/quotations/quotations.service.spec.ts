import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuotationsService } from './quotations.service';
import { Quotation, QuotationItem } from './quotation.entity';
import { NotFoundException } from '@nestjs/common';

describe('QuotationsService', () => {
  let service: QuotationsService;
  let quotationsRepository: jest.Mocked<Repository<Quotation>>;
  let itemsRepository: jest.Mocked<Repository<QuotationItem>>;

  const mockQuotation: Partial<Quotation> = {
    id: 'QUO-2026-001',
    projectId: 'PRJ-001',
    title: '室內設計報價單',
    status: 'QUO_DRAFT',
    subtotal: 500000,
    taxRate: 5,
    taxAmount: 25000,
    totalAmount: 525000,
    createdBy: 'user-123',
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
  };

  const mockQuotationsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockItemsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.getOne.mockResolvedValue(null);
    mockQuotationsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotationsService,
        {
          provide: getRepositoryToken(Quotation),
          useValue: mockQuotationsRepository,
        },
        {
          provide: getRepositoryToken(QuotationItem),
          useValue: mockItemsRepository,
        },
      ],
    }).compile();

    service = module.get<QuotationsService>(QuotationsService);
    quotationsRepository = module.get(getRepositoryToken(Quotation));
    itemsRepository = module.get(getRepositoryToken(QuotationItem));

    jest.clearAllMocks();

    // Re-setup createQueryBuilder after clearAllMocks
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.getOne.mockResolvedValue(null);
    mockQuotationsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  describe('findAll', () => {
    it('should return all quotations', async () => {
      mockQuotationsRepository.find.mockResolvedValue([mockQuotation]);
      
      const result = await service.findAll({});
      
      expect(result).toEqual([mockQuotation]);
      expect(mockQuotationsRepository.find).toHaveBeenCalled();
    });

    it('should filter by projectId', async () => {
      mockQuotationsRepository.find.mockResolvedValue([mockQuotation]);
      
      await service.findAll({ projectId: 'PRJ-001' });
      
      expect(mockQuotationsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'PRJ-001' }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockQuotationsRepository.find.mockResolvedValue([mockQuotation]);
      
      await service.findAll({ status: 'QUO_DRAFT' });
      
      expect(mockQuotationsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'QUO_DRAFT' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a quotation by id', async () => {
      mockQuotationsRepository.findOne.mockResolvedValue(mockQuotation);
      
      const result = await service.findOne('QUO-2026-001');
      
      expect(result).toEqual(mockQuotation);
    });

    it('should throw NotFoundException when quotation not found', async () => {
      mockQuotationsRepository.findOne.mockResolvedValue(null);
      
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new quotation', async () => {
      const createDto = {
        projectId: 'PRJ-001',
        title: '新報價單',
        subtotal: 300000,
        taxRate: 5,
      };
      
      mockQuotationsRepository.create.mockReturnValue({ ...mockQuotation, ...createDto } as Quotation);
      mockQuotationsRepository.save.mockResolvedValue({ ...mockQuotation, ...createDto } as Quotation);
      // findOne is called after save to return the full quotation with relations
      mockQuotationsRepository.findOne.mockResolvedValue({ ...mockQuotation, ...createDto } as Quotation);
      
      const result = await service.create(createDto as any, 'user-123');
      
      expect(result.title).toBe('新報價單');
    });
  });

  describe('update', () => {
    it('should update an existing quotation', async () => {
      const updateDto = { title: '更新後的報價單' };
      mockQuotationsRepository.findOne.mockResolvedValue(mockQuotation);
      mockQuotationsRepository.save.mockResolvedValue({ ...mockQuotation, ...updateDto });
      
      const result = await service.update('QUO-2026-001', updateDto as any, 'user-123');
      
      expect(result.title).toBe('更新後的報價單');
    });

    it('should throw NotFoundException when updating non-existent quotation', async () => {
      mockQuotationsRepository.findOne.mockResolvedValue(null);
      
      await expect(
        service.update('nonexistent', { title: 'test' } as any, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('submit', () => {
    it('should submit a draft quotation', async () => {
      const draftQuotation = {
        ...mockQuotation,
        status: 'QUO_DRAFT',
        items: [{ id: 'item-1' }],
        totalAmount: 525000,
      };
      mockQuotationsRepository.findOne.mockResolvedValue(draftQuotation);
      mockQuotationsRepository.save.mockResolvedValue({ ...draftQuotation, status: 'QUO_PENDING' });
      
      const result = await service.submit('QUO-2026-001', 'user-123');
      
      expect(result.status).toBe('QUO_PENDING');
    });
  });

  describe('approve', () => {
    it('should approve a pending quotation', async () => {
      const pendingQuotation = { ...mockQuotation, status: 'QUO_PENDING' };
      mockQuotationsRepository.findOne.mockResolvedValue(pendingQuotation);
      mockQuotationsRepository.save.mockResolvedValue({ ...pendingQuotation, status: 'QUO_APPROVED' });
      
      const result = await service.approve('QUO-2026-001', 'user-123');
      
      expect(result.status).toBe('QUO_APPROVED');
    });
  });

  describe('reject', () => {
    it('should reject a pending quotation with reason', async () => {
      const pendingQuotation = { ...mockQuotation, status: 'QUO_PENDING' };
      mockQuotationsRepository.findOne.mockResolvedValue(pendingQuotation);
      mockQuotationsRepository.save.mockResolvedValue({ ...pendingQuotation, status: 'QUO_DRAFT' });
      
      const result = await service.reject('QUO-2026-001', '價格過高', 'user-123');
      
      expect(result.status).toBe('QUO_DRAFT');
    });
  });
});
