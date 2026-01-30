import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CostEntry } from './cost-entry.entity';
import { CreateCostEntryDto, UpdateCostEntryDto, MarkPaidDto } from './cost-entry.dto';
import { FinanceService } from '../finance/finance.service';
import { isAdminRole } from '../../common/constants/roles';

@Injectable()
export class CostEntriesService {
  constructor(
    @InjectRepository(CostEntry)
    private costEntriesRepository: Repository<CostEntry>,
    private financeService: FinanceService
  ) {}

  async findAll(
    options: {
      projectId?: string;
      contractId?: string;
      category?: string;
      isPaid?: boolean;
      startDate?: string;
      endDate?: string;
    },
    userId?: string,
    userRole?: string
  ): Promise<CostEntry[]> {
    const where: any = {};
    if (options.projectId) where.projectId = options.projectId;
    if (options.contractId) where.contractId = options.contractId;
    if (options.category) where.category = options.category;
    if (options.isPaid !== undefined) where.isPaid = options.isPaid;

    const entries = await this.costEntriesRepository.find({
      where,
      relations: ['project', 'contract'],
      order: { entryDate: 'DESC' },
    });

    // Filter by ownership for non-admin users
    if (userId && userRole && !isAdminRole(userRole)) {
      return entries.filter(e => e.project?.createdBy === userId);
    }

    return entries;
  }

  async findOne(id: string, userId?: string, userRole?: string): Promise<CostEntry> {
    const entry = await this.costEntriesRepository.findOne({
      where: { id },
      relations: ['project', 'contract'],
    });
    if (!entry) {
      throw new NotFoundException(`Cost Entry ${id} not found`);
    }

    // Check ownership for non-admin users
    if (userId && userRole) {
      this.checkOwnership(entry, userId, userRole);
    }

    return entry;
  }

  /**
   * Check if user has access to cost entry via project ownership
   */
  private checkOwnership(entry: CostEntry, userId: string, userRole: string): void {
    if (isAdminRole(userRole)) return;

    if (entry.project?.createdBy !== userId) {
      throw new ForbiddenException('You do not have access to this cost entry');
    }
  }

  async getSummary(projectId: string) {
    const entries = await this.costEntriesRepository.find({
      where: { projectId },
    });

    const byCategory = entries.reduce(
      (acc, entry) => {
        if (!acc[entry.category]) {
          acc[entry.category] = { total: 0, paid: 0, unpaid: 0, count: 0 };
        }
        const amount = Number(entry.amount);
        acc[entry.category].total += amount;
        acc[entry.category].count++;
        if (entry.isPaid) {
          acc[entry.category].paid += amount;
        } else {
          acc[entry.category].unpaid += amount;
        }
        return acc;
      },
      {} as Record<string, { total: number; paid: number; unpaid: number; count: number }>
    );

    const totalCost = entries.reduce((sum, e) => sum + Number(e.amount), 0);
    const paidCost = entries.filter(e => e.isPaid).reduce((sum, e) => sum + Number(e.amount), 0);
    const unpaidCost = totalCost - paidCost;

    return {
      projectId,
      totalCost,
      paidCost,
      unpaidCost,
      entryCount: entries.length,
      byCategory,
    };
  }

  async create(dto: CreateCostEntryDto, userId?: string): Promise<CostEntry> {
    const id = await this.generateId();

    const entry = this.costEntriesRepository.create({
      ...dto,
      id,
      entryDate: new Date(dto.entryDate),
    });

    return this.costEntriesRepository.save(entry);
  }

  async update(id: string, dto: UpdateCostEntryDto, userId?: string): Promise<CostEntry> {
    const entry = await this.findOne(id);

    if (dto.entryDate) {
      (entry as any).entryDate = new Date(dto.entryDate);
      delete dto.entryDate;
    }

    Object.assign(entry, dto);
    return this.costEntriesRepository.save(entry);
  }

  async markPaid(id: string, dto: MarkPaidDto, userId?: string): Promise<CostEntry> {
    const entry = await this.findOne(id);

    entry.isPaid = true;
    entry.paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    entry.paymentMethod = dto.paymentMethod || 'BANK_TRANSFER';

    await this.costEntriesRepository.save(entry);

    // 自動建立財務交易記錄 (支出)
    await this.financeService.createTransactionFromSource({
      type: '支出',
      amount: Number(entry.amount),
      date: entry.paidAt,
      category: entry.category || '專案成本',
      description: `成本 ${entry.id}: ${entry.description || ''}`,
      projectId: entry.projectId,
      referenceType: 'COST_ENTRY',
      referenceId: id,
      createdBy: userId,
    });

    return entry;
  }

  async delete(id: string): Promise<void> {
    const entry = await this.findOne(id);
    await this.costEntriesRepository.remove(entry);
  }

  private async generateId(): Promise<string> {
    const date = new Date();
    const prefix = `COST-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-`;

    const last = await this.costEntriesRepository
      .createQueryBuilder('c')
      .where('c.id LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('c.id', 'DESC')
      .getOne();

    let seq = 1;
    if (last) {
      const lastSeq = parseInt(last.id.split('-')[2], 10);
      seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(4, '0')}`;
  }
}
