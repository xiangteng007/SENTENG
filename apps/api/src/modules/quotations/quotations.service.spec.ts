import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuotationsService } from './quotations.service';
import { Quotation } from './quotation.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('QuotationsService', () => {
  let service: QuotationsService;
  let repository: jest.Mocked<Repository<Quotation>>;

  const mockQuotation: Partial<Quotation> = {
    id: 'QUO-2026-001',
    projectId: 'PRJ-001',
    title: '室內設計報價單',
    status: 'QUO_DRAFT',
    subtotal: 500000,
    tax: 25000,
    total: 525000,
    createdBy: 'user-123',
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotationsService,
        {
          provide: getRepositoryToken(Quotation),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<QuotationsService>(QuotationsService);
    repository = module.get(getRepositoryToken(Quotation));

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all quotations for admin', async () => {
      mockRepository.find.mockResolvedValue([mockQuotation]);
      
      const result = await service.findAll({}, 'admin-user', 'admin');
      
      expect(result).toEqual([mockQuotation]);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should filter by projectId', async () => {
      mockRepository.find.mockResolvedValue([mockQuotation]);
      
      await service.findAll({ projectId: 'PRJ-001' }, 'user-123', 'member');
      
      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'PRJ-001' }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockRepository.find.mockResolvedValue([mockQuotation]);
      
      await service.findAll({ status: 'QUO_DRAFT' }, 'user-123', 'admin');
      
      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'QUO_DRAFT' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a quotation by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockQuotation);
      
      const result = await service.findOne('QUO-2026-001', 'user-123', 'member');
      
      expect(result).toEqual(mockQuotation);
    });

    it('should throw NotFoundException when quotation not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      
      await expect(
        service.findOne('nonexistent', 'user-123', 'member'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new quotation', async () => {
      const createDto = {
        projectId: 'PRJ-001',
        title: '新報價單',
        subtotal: 300000,
        tax: 15000,
        total: 315000,
      };
      
      mockRepository.count.mockResolvedValue(0);
      mockRepository.create.mockReturnValue({ ...mockQuotation, ...createDto });
      mockRepository.save.mockResolvedValue({ ...mockQuotation, ...createDto });
      
      const result = await service.create(createDto as any, 'user-123');
      
      expect(result.title).toBe('新報價單');
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing quotation', async () => {
      const updateDto = { title: '更新後的報價單' };
      mockRepository.findOne.mockResolvedValue(mockQuotation);
      mockRepository.save.mockResolvedValue({ ...mockQuotation, ...updateDto });
      
      const result = await service.update('QUO-2026-001', updateDto as any, 'user-123');
      
      expect(result.title).toBe('更新後的報價單');
    });

    it('should throw NotFoundException when updating non-existent quotation', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      
      await expect(
        service.update('nonexistent', { title: 'test' } as any, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should approve a draft quotation', async () => {
      const draftQuotation = { ...mockQuotation, status: 'QUO_DRAFT' };
      mockRepository.findOne.mockResolvedValue(draftQuotation);
      mockRepository.save.mockResolvedValue({ ...draftQuotation, status: 'QUO_APPROVED' });
      
      const result = await service.approve('QUO-2026-001', 'user-123');
      
      expect(result.status).toBe('QUO_APPROVED');
    });
  });

  describe('lock', () => {
    it('should lock an approved quotation', async () => {
      const approvedQuotation = { ...mockQuotation, status: 'QUO_APPROVED' };
      mockRepository.findOne.mockResolvedValue(approvedQuotation);
      mockRepository.save.mockResolvedValue({ ...approvedQuotation, status: 'QUO_LOCKED' });
      
      const result = await service.lock('QUO-2026-001', 'user-123');
      
      expect(result.status).toBe('QUO_LOCKED');
    });
  });
});
