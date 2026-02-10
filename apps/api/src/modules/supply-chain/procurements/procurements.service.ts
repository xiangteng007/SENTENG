import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere } from "typeorm";
import { Procurement, ProcurementBid } from "./procurement.entity";
import {
  CreateProcurementDto,
  UpdateProcurementDto,
  ProcurementQueryDto,
} from "./procurement.dto";

@Injectable()
export class ProcurementsService {
  constructor(
    @InjectRepository(Procurement)
    private procurementRepo: Repository<Procurement>,
    @InjectRepository(ProcurementBid)
    private bidRepo: Repository<ProcurementBid>,
  ) {}

  async findAll(query: ProcurementQueryDto) {
    const where: FindOptionsWhere<Procurement> = {};
    if (query.status) where.status = query.status;
    if (query.projectId) where.projectId = query.projectId;

    const [items, total] = await this.procurementRepo.findAndCount({
      where,
      relations: ["project", "awardedPartner"],
      order: { createdAt: "DESC" },
    });

    return { items, total };
  }

  async findOne(id: string): Promise<Procurement> {
    const procurement = await this.procurementRepo.findOne({
      where: { id },
      relations: ["project", "awardedPartner", "bids", "bids.partner"],
    });
    if (!procurement) {
      throw new NotFoundException(`Procurement ${id} not found`);
    }
    return procurement;
  }

  async create(
    dto: CreateProcurementDto,
    userId?: string,
  ): Promise<Procurement> {
    const procurement = this.procurementRepo.create({
      ...dto,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      createdBy: userId,
    });
    return this.procurementRepo.save(procurement);
  }

  async update(id: string, dto: UpdateProcurementDto): Promise<Procurement> {
    const procurement = await this.findOne(id);
    Object.assign(procurement, dto);
    if (dto.deadline) procurement.deadline = new Date(dto.deadline);
    return this.procurementRepo.save(procurement);
  }

  async remove(id: string): Promise<void> {
    const procurement = await this.procurementRepo.findOne({ where: { id } });
    if (!procurement) {
      throw new NotFoundException(`Procurement ${id} not found`);
    }
    await this.procurementRepo.remove(procurement);
  }
}
