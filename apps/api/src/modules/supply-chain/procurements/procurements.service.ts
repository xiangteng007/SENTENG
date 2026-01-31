import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Procurement, ProcurementBid, ProcurementStatus } from './procurement.entity';
import {
  CreateProcurementDto,
  UpdateProcurementDto,
  SubmitBidDto,
  AwardBidDto,
  EvaluateBidDto,
  ProcurementQueryDto,
} from './procurement.dto';

@Injectable()
export class ProcurementsService {
  constructor(
    @InjectRepository(Procurement)
    private procurementRepo: Repository<Procurement>,
    @InjectRepository(ProcurementBid)
    private bidRepo: Repository<ProcurementBid>
  ) {}

  async findAll(query: ProcurementQueryDto): Promise<{ items: Procurement[]; total: number }> {
    const { page = 1, limit = 20, projectId, status, type, search } = query;
    const qb = this.procurementRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.bids', 'bids')
      .leftJoinAndSelect('p.awardedVendor', 'awardedVendor');

    if (projectId) qb.andWhere('p.projectId = :projectId', { projectId });
    if (status) qb.andWhere('p.status = :status', { status });
    if (type) qb.andWhere('p.type = :type', { type });
    if (search) {
      qb.andWhere('(p.title ILIKE :search OR p.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [items, total] = await qb
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findOne(id: string): Promise<Procurement> {
    const procurement = await this.procurementRepo.findOne({
      where: { id },
      relations: ['project', 'bids', 'bids.vendor', 'awardedVendor'],
    });
    if (!procurement) throw new NotFoundException(`Procurement ${id} not found`);
    return procurement;
  }

  async create(dto: CreateProcurementDto, userId?: string): Promise<Procurement> {
    const procurement = this.procurementRepo.create({
      ...dto,
      createdBy: userId,
    });
    return this.procurementRepo.save(procurement);
  }

  async update(id: string, dto: UpdateProcurementDto): Promise<Procurement> {
    const procurement = await this.findOne(id);
    Object.assign(procurement, dto);
    return this.procurementRepo.save(procurement);
  }

  async sendRfq(id: string, vendorIds: string[]): Promise<Procurement> {
    const procurement = await this.findOne(id);
    if (procurement.status !== ProcurementStatus.DRAFT) {
      throw new BadRequestException('Can only send RFQ for draft procurements');
    }
    procurement.status = ProcurementStatus.RFQ_SENT;
    // In real implementation, send notifications to vendors
    return this.procurementRepo.save(procurement);
  }

  async submitBid(procurementId: string, dto: SubmitBidDto): Promise<ProcurementBid> {
    const procurement = await this.findOne(procurementId);
    if (
      ![ProcurementStatus.RFQ_SENT, ProcurementStatus.BIDDING].includes(
        procurement.status as ProcurementStatus
      )
    ) {
      throw new BadRequestException('Procurement is not accepting bids');
    }

    // Check if vendor already submitted
    const existing = await this.bidRepo.findOne({
      where: { procurementId, vendorId: dto.vendorId },
    });
    if (existing) {
      throw new BadRequestException('Vendor has already submitted a bid');
    }

    const bid = this.bidRepo.create({
      ...dto,
      procurementId,
    });

    // Update procurement status to bidding if first bid
    if (procurement.status === ProcurementStatus.RFQ_SENT) {
      procurement.status = ProcurementStatus.BIDDING;
      await this.procurementRepo.save(procurement);
    }

    return this.bidRepo.save(bid);
  }

  async evaluateBid(bidId: string, dto: EvaluateBidDto): Promise<ProcurementBid> {
    const bid = await this.bidRepo.findOne({ where: { id: bidId } });
    if (!bid) throw new NotFoundException(`Bid ${bidId} not found`);

    bid.evaluationScore = dto.score;
    bid.evaluationNotes = dto.notes || null;
    return this.bidRepo.save(bid);
  }

  async awardBid(procurementId: string, dto: AwardBidDto): Promise<Procurement> {
    const procurement = await this.findOne(procurementId);
    const bid = await this.bidRepo.findOne({
      where: { id: dto.bidId },
      relations: ['vendor'],
    });

    if (!bid) throw new NotFoundException(`Bid ${dto.bidId} not found`);
    if (bid.procurementId !== procurementId) {
      throw new BadRequestException('Bid does not belong to this procurement');
    }

    // Mark bid as selected
    bid.isSelected = true;
    await this.bidRepo.save(bid);

    // Update procurement
    procurement.status = ProcurementStatus.AWARDED;
    procurement.awardedVendorId = bid.vendorId;
    procurement.awardedAmount = bid.bidAmount;
    procurement.awardReason = dto.awardReason || null;

    return this.procurementRepo.save(procurement);
  }

  async getComparison(procurementId: string): Promise<any> {
    const procurement = await this.findOne(procurementId);
    const bids = await this.bidRepo.find({
      where: { procurementId },
      relations: ['vendor'],
      order: { bidAmount: 'ASC' },
    });

    return {
      procurement: {
        id: procurement.id,
        title: procurement.title,
        budgetAmount: procurement.budgetAmount,
      },
      bids: bids.map(b => ({
        id: b.id,
        vendor: b.vendor?.name,
        vendorId: b.vendorId,
        bidAmount: b.bidAmount,
        leadTimeDays: b.leadTimeDays,
        evaluationScore: b.evaluationScore,
        isSelected: b.isSelected,
        savingsPercent: procurement.budgetAmount
          ? (((procurement.budgetAmount - b.bidAmount) / procurement.budgetAmount) * 100).toFixed(2)
          : null,
      })),
      lowestBid: bids[0] || null,
      averageBid: bids.length
        ? bids.reduce((sum, b) => sum + Number(b.bidAmount), 0) / bids.length
        : 0,
    };
  }

  async remove(id: string): Promise<void> {
    const procurement = await this.findOne(id);
    await this.procurementRepo.remove(procurement);
  }
}
