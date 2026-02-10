import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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
    const qb = this.procurementRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.awardedPartner", "awardedPartner");

    if (query.status) {
      qb.andWhere("p.status = :status", { status: query.status });
    }
    if (query.projectId) {
      qb.andWhere("p.projectId = :projectId", {
        projectId: query.projectId,
      });
    }

    qb.orderBy("p.createdAt", "DESC");

    const [items, total] = await qb.getManyAndCount();

    return { items, total };
  }

  async findOne(id: string): Promise<Procurement> {
    const procurement = await this.procurementRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.awardedPartner", "awardedPartner")
      .leftJoinAndSelect("p.bids", "bids")
      .leftJoinAndSelect("bids.partner", "bidPartner")
      .where("p.id = :id", { id })
      .getOne();
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
