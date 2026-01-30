import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceService } from './finance.service';
import { Account, Transaction, Loan } from './entities';
import { NotFoundException } from '@nestjs/common';

describe('FinanceService', () => {
  let service: FinanceService;

  const mockAccount = {
    id: 'acc-1',
    name: 'Operating Account',
    type: '銀行帳戶',
    balance: 100000,
    createdAt: new Date(),
  };

  const mockTransaction = {
    id: 'txn-1',
    type: '收入',
    amount: 50000,
    date: new Date(),
    category: 'Sales',
  };

  const mockLoan = {
    id: 'loan-1',
    name: 'Business Loan',
    principalAmount: 1000000,
    remainingPrincipal: 800000,
    paidTerms: 6,
    totalTerms: 24,
    status: 'active',
  };

  const mockAccountRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockTransactionRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockLoanRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: getRepositoryToken(Account), useValue: mockAccountRepo },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepo,
        },
        { provide: getRepositoryToken(Loan), useValue: mockLoanRepo },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    jest.clearAllMocks();
  });

  // ==================== Account Tests ====================
  describe('Accounts', () => {
    it('should find all accounts', async () => {
      mockAccountRepo.find.mockResolvedValue([mockAccount]);
      const result = await service.findAllAccounts();
      expect(result).toEqual([mockAccount]);
    });

    it('should find account by id', async () => {
      mockAccountRepo.findOne.mockResolvedValue(mockAccount);
      const result = await service.findAccountById('acc-1');
      expect(result.id).toBe('acc-1');
    });

    it('should throw NotFoundException for missing account', async () => {
      mockAccountRepo.findOne.mockResolvedValue(null);
      await expect(service.findAccountById('not-exist')).rejects.toThrow(NotFoundException);
    });

    it('should create account', async () => {
      mockAccountRepo.save.mockResolvedValue(mockAccount);
      const result = await service.createAccount({ name: 'New Account' } as any);
      expect(mockAccountRepo.save).toHaveBeenCalled();
    });

    it('should delete account', async () => {
      mockAccountRepo.findOne.mockResolvedValue(mockAccount);
      mockAccountRepo.remove.mockResolvedValue(mockAccount);
      await service.deleteAccount('acc-1');
      expect(mockAccountRepo.remove).toHaveBeenCalled();
    });
  });

  // ==================== Transaction Tests ====================
  describe('Transactions', () => {
    it('should find all transactions', async () => {
      mockTransactionRepo.find.mockResolvedValue([mockTransaction]);
      const result = await service.findAllTransactions();
      expect(result).toEqual([mockTransaction]);
    });

    it('should find transaction by id', async () => {
      mockTransactionRepo.findOne.mockResolvedValue(mockTransaction);
      const result = await service.findTransactionById('txn-1');
      expect(result.id).toBe('txn-1');
    });

    it('should throw NotFoundException for missing transaction', async () => {
      mockTransactionRepo.findOne.mockResolvedValue(null);
      await expect(service.findTransactionById('not-exist')).rejects.toThrow(NotFoundException);
    });

    it('should create transaction', async () => {
      mockTransactionRepo.save.mockResolvedValue(mockTransaction);
      const result = await service.createTransaction({
        type: '收入',
        amount: 1000,
      } as any);
      expect(mockTransactionRepo.save).toHaveBeenCalled();
    });

    it('should find transactions by project', async () => {
      mockTransactionRepo.find.mockResolvedValue([mockTransaction]);
      const result = await service.findTransactionsByProject('proj-1');
      expect(mockTransactionRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1' },
        })
      );
    });

    it('should deduplicate when creating from source', async () => {
      mockTransactionRepo.findOne.mockResolvedValue(mockTransaction);
      const result = await service.createTransactionFromSource({
        type: '收入',
        amount: 1000,
        date: new Date(),
        referenceType: 'receipt',
        referenceId: 'rcpt-1',
      });
      // Should return existing, not create new
      expect(result).toEqual(mockTransaction);
      expect(mockTransactionRepo.save).not.toHaveBeenCalled();
    });
  });

  // ==================== Loan Tests ====================
  describe('Loans', () => {
    it('should find all loans', async () => {
      mockLoanRepo.find.mockResolvedValue([mockLoan]);
      const result = await service.findAllLoans();
      expect(result).toEqual([mockLoan]);
    });

    it('should find loan by id', async () => {
      mockLoanRepo.findOne.mockResolvedValue(mockLoan);
      const result = await service.findLoanById('loan-1');
      expect(result.id).toBe('loan-1');
    });

    it('should throw NotFoundException for missing loan', async () => {
      mockLoanRepo.findOne.mockResolvedValue(null);
      await expect(service.findLoanById('not-exist')).rejects.toThrow(NotFoundException);
    });

    it('should create loan with remaining principal', async () => {
      const newLoan = { principalAmount: 500000 };
      mockLoanRepo.save.mockImplementation(loan => Promise.resolve(loan));
      const result = await service.createLoan(newLoan as any);
      expect(result.remainingPrincipal).toBe(500000);
    });

    it('should record loan payment', async () => {
      const loan = { ...mockLoan, monthlyPayment: 50000 };
      mockLoanRepo.findOne.mockResolvedValue(loan);
      mockLoanRepo.save.mockImplementation(l => Promise.resolve(l));
      const result = await service.recordLoanPayment('loan-1');
      expect(result.paidTerms).toBe(7);
      expect(result.remainingPrincipal).toBe(750000);
    });

    it('should mark loan as completed when fully paid', async () => {
      const almostDone = { ...mockLoan, paidTerms: 23, totalTerms: 24 };
      mockLoanRepo.findOne.mockResolvedValue(almostDone);
      mockLoanRepo.save.mockImplementation(l => Promise.resolve(l));
      const result = await service.recordLoanPayment('loan-1');
      expect(result.status).toBe('completed');
    });
  });
});
