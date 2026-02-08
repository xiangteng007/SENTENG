import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InvoicesService } from './invoices.service';
import { Invoice } from './invoice.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { createMockRepository } from '../../common/test-helpers/create-test-module';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  const mockInvoice: Partial<Invoice> = {
    id: 'inv-001',
    invoiceNumber: '12345678',
    docType: 'INVOICE_B2B',
    currentState: 'DRAFT',
    buyerTaxId: '12345678',
    sellerName: 'Test Seller',
    amountNet: 1000,
    amountTax: 50,
    amountGross: 1050,
    createdBy: 'user-1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = createMockRepository({
      queryBuilder: {
        getManyAndCountResult: [[mockInvoice], 1],
        getManyResult: [mockInvoice],
        getRawOneResult: { totalCount: '10' },
        getCountResult: 10,
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
    });

    it('should filter by user for non-admin roles', async () => {
      const result = await service.findAll({ page: 1, limit: 10 }, 'user-1', 'user');

      expect(result).toHaveProperty('data');
    });
  });

  describe('findOne', () => {
    it('should return invoice when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockInvoice);

      const result = await service.findOne('inv-001');

      expect(result).toEqual(mockInvoice);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner access', async () => {
      mockRepository.findOne.mockResolvedValue(mockInvoice);

      await expect(service.findOne('inv-001', 'other-user', 'user')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should allow admin to access any invoice', async () => {
      mockRepository.findOne.mockResolvedValue(mockInvoice);

      const result = await service.findOne('inv-001', 'admin-user', 'admin');

      expect(result).toEqual(mockInvoice);
    });
  });

  describe('create', () => {
    it('should create invoice successfully', async () => {
      const createDto = {
        invoiceNumber: '12345678',
        invoiceTrack: 'AB',
        invoiceDate: new Date().toISOString(),
        sellerTaxId: '12345678',
        amountNet: 1000,
      };

      mockRepository.create.mockReturnValue(mockInvoice);
      mockRepository.save.mockResolvedValue(mockInvoice);

      const result = await service.create(createDto, 'user-1');

      expect(result).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      const result = await service.getStats();

      expect(result).toBeDefined();
    });
  });

  describe('IDOR Protection', () => {
    it('should allow owner to access their invoice', async () => {
      mockRepository.findOne.mockResolvedValue(mockInvoice);

      const result = await service.findOne('inv-001', 'user-1', 'user');

      expect(result).toEqual(mockInvoice);
    });

    it('should block non-owner access for user role', async () => {
      mockRepository.findOne.mockResolvedValue(mockInvoice);

      await expect(service.findOne('inv-001', 'other-user', 'user')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should allow super_admin to access any invoice', async () => {
      mockRepository.findOne.mockResolvedValue(mockInvoice);

      const result = await service.findOne('inv-001', 'any-admin', 'super_admin');

      expect(result).toEqual(mockInvoice);
    });
  });
});
