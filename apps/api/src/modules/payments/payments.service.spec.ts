import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentApplication, PaymentReceipt } from './payment.entity';
import { ContractsService } from '../contracts/contracts.service';
import { FinanceService } from '../finance/finance.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockProject = {
    id: 'proj-1',
    name: 'Test Project',
    createdBy: 'user-123',
  };

  const mockContract = {
    id: 'contract-1',
    name: 'Test Contract',
    status: 'CTR_ACTIVE',
    currentAmount: 1000000,
    projectId: 'proj-1',
  };

  const mockPayment = {
    id: 'payment-1',
    contractId: 'contract-1',
    projectId: 'proj-1',
    periodNo: 1,
    progressPercent: 30,
    cumulativePercent: 30,
    amount: 300000,
    requestAmount: 300000,
    status: 'PAY_DRAFT',
    project: mockProject,
    contract: mockContract,
  };

  const mockReceipt = {
    id: 'receipt-1',
    applicationId: 'payment-1',
    amount: 300000,
    receivedAt: new Date(),
  };

  // Mock QueryBuilder
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };

  const mockPaymentRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    create: jest.fn().mockImplementation(dto => ({ ...dto })),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockReceiptRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn().mockImplementation(dto => ({ ...dto })),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockContractsService = {
    findOne: jest.fn(),
  };

  const mockFinanceService = {
    createTransactionFromSource: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(PaymentApplication), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(PaymentReceipt), useValue: mockReceiptRepo },
        { provide: ContractsService, useValue: mockContractsService },
        { provide: FinanceService, useValue: mockFinanceService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all payments for admin', async () => {
      mockPaymentRepo.find.mockResolvedValue([mockPayment]);
      const result = await service.findAll({}, 'admin-id', 'admin');
      expect(result).toHaveLength(1);
    });

    it('should filter by ownership for non-admin users', async () => {
      const otherUserPayment = {
        ...mockPayment,
        id: 'payment-2',
        project: { ...mockProject, createdBy: 'other-user' },
      };
      mockPaymentRepo.find.mockResolvedValue([mockPayment, otherUserPayment]);

      const result = await service.findAll({}, 'user-123', 'user');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('payment-1');
    });

    it('should filter by contractId when provided', async () => {
      mockPaymentRepo.find.mockResolvedValue([mockPayment]);
      await service.findAll({ contractId: 'contract-1' });
      
      expect(mockPaymentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ contractId: 'contract-1' }),
        })
      );
    });

    it('should filter by status when provided', async () => {
      mockPaymentRepo.find.mockResolvedValue([mockPayment]);
      await service.findAll({ status: 'approved' });
      
      expect(mockPaymentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'approved' }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return payment by id', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      const result = await service.findOne('payment-1');
      expect(result.id).toBe('payment-1');
    });

    it('should throw NotFoundException for missing payment', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('not-exist')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner access', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      await expect(
        service.findOne('payment-1', 'other-user', 'user')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to access any payment', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      const result = await service.findOne('payment-1', 'admin-id', 'admin');
      expect(result.id).toBe('payment-1');
    });
  });

  describe('create', () => {
    it('should reject if contract is not active', async () => {
      mockContractsService.findOne.mockResolvedValue({
        ...mockContract,
        status: 'CTR_DRAFT',
      });

      // Using any to bypass strict DTO validation in tests
      await expect(service.create({ contractId: 'contract-1' } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('status transitions', () => {
    it('submit should validate draft status', async () => {
      // Payment not in draft status - should throw
      const submitted = { ...mockPayment, status: 'PAY_PENDING' };
      mockPaymentRepo.findOne.mockResolvedValue(submitted);

      await expect(service.submit('payment-1')).rejects.toThrow(BadRequestException);
    });

    // Note: approve/reject tests require more complex mocking due to internal business logic
    // These are covered by integration tests
  });

  // Note: getReceipts requires specific repository method behavior covered in integration tests
});
