import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Account, Transaction, Loan } from "./entities";
import {
  CreateAccountDto,
  UpdateAccountDto,
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateLoanDto,
  UpdateLoanDto,
} from "./finance.dto";

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
  ) {}

  // ==================== Account Methods ====================
  async findAllAccounts(): Promise<Account[]> {
    return this.accountRepository.find({
      order: { sortOrder: "ASC", createdAt: "DESC" },
    });
  }

  async findAccountById(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`Account with ID "${id}" not found`);
    }
    return account;
  }

  async createAccount(dto: CreateAccountDto): Promise<Account> {
    const account = new Account();
    Object.assign(account, dto);
    return this.accountRepository.save(account);
  }

  async updateAccount(id: string, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.findAccountById(id);
    Object.assign(account, dto);
    return this.accountRepository.save(account);
  }

  async deleteAccount(id: string): Promise<void> {
    const account = await this.findAccountById(id);
    await this.accountRepository.remove(account);
  }

  // ==================== Transaction Methods ====================
  async findAllTransactions(): Promise<Transaction[]> {
    try {
      return await this.transactionRepository.find({
        order: { date: "DESC", createdAt: "DESC" },
        relations: ["account"],
      });
    } catch (error) {
      this.logger.warn(
        "Transaction query with relations failed, retrying without",
        error,
      );
      // If relation fails, try without it
      try {
        return await this.transactionRepository.find({
          order: { date: "DESC", createdAt: "DESC" },
        });
      } catch (innerError) {
        this.logger.error("Transaction query still failed", innerError);
        throw innerError;
      }
    }
  }

  async findTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ["account"],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID "${id}" not found`);
    }
    return transaction;
  }

  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    const transaction = new Transaction();
    Object.assign(transaction, dto);
    return this.transactionRepository.save(transaction);
  }

  async updateTransaction(
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findTransactionById(id);
    Object.assign(transaction, dto);
    return this.transactionRepository.save(transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    const transaction = await this.findTransactionById(id);
    await this.transactionRepository.remove(transaction);
  }

  /**
   * Auto-create transaction from receipt or cost entry
   * With deduplication check using referenceType + referenceId
   */
  async createTransactionFromSource(params: {
    type: "收入" | "支出";
    amount: number;
    date: Date;
    category?: string;
    description?: string;
    accountId?: string;
    projectId?: string;
    referenceType: string;
    referenceId: string;
    createdBy?: string;
  }): Promise<Transaction | null> {
    // Check for duplicate
    const existing = await this.transactionRepository.findOne({
      where: {
        referenceType: params.referenceType,
        referenceId: params.referenceId,
      },
    });

    if (existing) {
      // Already exists, return existing instead of creating duplicate
      return existing;
    }

    const transaction = new Transaction();
    transaction.type = params.type;
    transaction.amount = params.amount;
    transaction.date = params.date;
    if (params.category) transaction.category = params.category;
    if (params.description) transaction.desc = params.description;
    if (params.accountId) transaction.accountId = params.accountId;
    if (params.projectId) transaction.projectId = params.projectId;
    transaction.referenceType = params.referenceType;
    transaction.referenceId = params.referenceId;
    if (params.createdBy) transaction.createdBy = params.createdBy;

    return this.transactionRepository.save(transaction);
  }

  /**
   * Find transactions by project ID
   */
  async findTransactionsByProject(projectId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { projectId },
      order: { date: "DESC" },
      relations: ["account"],
    });
  }

  // ==================== Loan Methods ====================
  async findAllLoans(): Promise<Loan[]> {
    return this.loanRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  async findLoanById(id: string): Promise<Loan> {
    const loan = await this.loanRepository.findOne({ where: { id } });
    if (!loan) {
      throw new NotFoundException(`Loan with ID "${id}" not found`);
    }
    return loan;
  }

  async createLoan(dto: CreateLoanDto): Promise<Loan> {
    const loan = new Loan();
    Object.assign(loan, dto);
    // Set remaining principal to principal amount if not provided
    if (!loan.remainingPrincipal) {
      loan.remainingPrincipal = loan.principalAmount;
    }
    return this.loanRepository.save(loan);
  }

  async updateLoan(id: string, dto: UpdateLoanDto): Promise<Loan> {
    const loan = await this.findLoanById(id);
    Object.assign(loan, dto);
    return this.loanRepository.save(loan);
  }

  async deleteLoan(id: string): Promise<void> {
    const loan = await this.findLoanById(id);
    await this.loanRepository.remove(loan);
  }

  async recordLoanPayment(id: string): Promise<Loan> {
    const loan = await this.findLoanById(id);
    loan.paidTerms += 1;
    if (loan.paidTerms >= loan.totalTerms) {
      loan.status = "completed";
    }
    // Update remaining principal
    if (loan.monthlyPayment) {
      loan.remainingPrincipal = Math.max(
        0,
        Number(loan.remainingPrincipal) - Number(loan.monthlyPayment),
      );
    }
    return this.loanRepository.save(loan);
  }
}
