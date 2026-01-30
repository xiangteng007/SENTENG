import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangeOrder, ChangeOrderItem } from './change-order.entity';
import { CreateChangeOrderDto, UpdateChangeOrderDto } from './change-order.dto';
import { ContractsService } from '../contracts/contracts.service';

@Injectable()
export class ChangeOrdersService {
  constructor(
    @InjectRepository(ChangeOrder)
    private changeOrdersRepository: Repository<ChangeOrder>,
    @InjectRepository(ChangeOrderItem)
    private itemsRepository: Repository<ChangeOrderItem>,
    private contractsService: ContractsService
  ) {}

  async findAll(options: {
    contractId?: string;
    projectId?: string;
    status?: string;
  }): Promise<ChangeOrder[]> {
    const where: any = {};
    if (options.contractId) where.contractId = options.contractId;
    if (options.projectId) where.projectId = options.projectId;
    if (options.status) where.status = options.status;

    return this.changeOrdersRepository.find({
      where,
      relations: ['contract', 'project', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ChangeOrder> {
    const co = await this.changeOrdersRepository.findOne({
      where: { id },
      relations: ['contract', 'project', 'items'],
    });
    if (!co) {
      throw new NotFoundException(`Change Order ${id} not found`);
    }
    return co;
  }

  async create(dto: CreateChangeOrderDto, userId?: string): Promise<ChangeOrder> {
    const contract = await this.contractsService.findOne(dto.contractId);

    if (!['CTR_ACTIVE', 'CTR_WARRANTY'].includes(contract.status)) {
      throw new BadRequestException('只有執行中或保固中的合約可新增變更單');
    }

    const id = await this.generateId();
    const coNumber = await this.generateCoNumber(dto.contractId);

    // 計算金額
    const items =
      dto.items?.map((item, idx) => ({
        ...item,
        id: `${id}-${String(idx + 1).padStart(3, '0')}`,
        changeOrderId: id,
        itemOrder: idx + 1,
        amount: item.quantity * item.unitPrice,
      })) || [];

    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);

    const changeOrder = this.changeOrdersRepository.create({
      id,
      contractId: dto.contractId,
      projectId: contract.projectId,
      coNumber,
      title: dto.title,
      reason: dto.reason,
      amount: totalAmount,
      daysImpact: dto.daysImpact || 0,
      notes: dto.notes,
      status: 'CO_DRAFT',
    });

    await this.changeOrdersRepository.save(changeOrder);

    if (items.length > 0) {
      await this.itemsRepository.save(items);
    }

    return this.findOne(id);
  }

  async update(id: string, dto: UpdateChangeOrderDto, userId?: string): Promise<ChangeOrder> {
    const co = await this.findOne(id);

    if (co.status !== 'CO_DRAFT') {
      throw new BadRequestException('只有草稿狀態可修改');
    }

    if (dto.items) {
      await this.itemsRepository.delete({ changeOrderId: id });

      const items = dto.items.map((item, idx) => ({
        ...item,
        id: `${id}-${String(idx + 1).padStart(3, '0')}`,
        changeOrderId: id,
        itemOrder: idx + 1,
        amount: item.quantity * item.unitPrice,
      }));

      await this.itemsRepository.save(items);

      const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);
      (co as any).amount = totalAmount;
    }

    Object.assign(co, dto);
    await this.changeOrdersRepository.save(co);
    return this.findOne(id);
  }

  async submit(id: string, userId?: string): Promise<ChangeOrder> {
    const co = await this.findOne(id);

    if (co.status !== 'CO_DRAFT') {
      throw new BadRequestException('只有草稿狀態可提交');
    }

    co.status = 'CO_PENDING';
    return this.changeOrdersRepository.save(co);
  }

  async approve(id: string, userId?: string): Promise<ChangeOrder> {
    const co = await this.findOne(id);

    if (co.status !== 'CO_PENDING') {
      throw new BadRequestException('只有待審核狀態可核准');
    }

    co.status = 'CO_APPROVED';
    co.approvedAt = new Date();
    if (userId) co.approvedBy = userId;

    // 更新合約金額
    const contract = await this.contractsService.findOne(co.contractId);
    const newChangeAmount = Number(contract.changeAmount) + Number(co.amount);
    const newCurrentAmount = Number(contract.originalAmount) + newChangeAmount;

    await this.contractsService.update(co.contractId, {
      // Note: This would need a custom method to update these fields
    });

    return this.changeOrdersRepository.save(co);
  }

  async reject(id: string, reason: string, userId?: string): Promise<ChangeOrder> {
    const co = await this.findOne(id);

    if (co.status !== 'CO_PENDING') {
      throw new BadRequestException('只有待審核狀態可駁回');
    }

    co.status = 'CO_DRAFT';
    co.notes = `[駁回] ${reason}\n${co.notes || ''}`;
    return this.changeOrdersRepository.save(co);
  }

  private async generateId(): Promise<string> {
    const date = new Date();
    const prefix = `CO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-`;

    const last = await this.changeOrdersRepository
      .createQueryBuilder('co')
      .where('co.id LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('co.id', 'DESC')
      .getOne();

    let seq = 1;
    if (last) {
      const lastSeq = parseInt(last.id.split('-')[2], 10);
      seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  private async generateCoNumber(contractId: string): Promise<string> {
    const existing = await this.changeOrdersRepository.count({
      where: { contractId },
    });
    return `CO-${String(existing + 1).padStart(3, '0')}`;
  }
}
