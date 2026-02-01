import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  LessThanOrEqual,
  MoreThanOrEqual,
  FindOptionsWhere,
} from "typeorm";
import {
  ProjectInsurance,
  InsuranceClaim,
  InsuranceRateReference,
} from "./insurance.entity";
import {
  CreateInsuranceDto,
  UpdateInsuranceDto,
  InsuranceQueryDto,
  AddClaimDto,
} from "./insurance.dto";

@Injectable()
export class InsuranceService {
  constructor(
    @InjectRepository(ProjectInsurance)
    private readonly insuranceRepository: Repository<ProjectInsurance>,
    @InjectRepository(InsuranceRateReference)
    private readonly rateRepository: Repository<InsuranceRateReference>,
  ) {}

  async findAll(
    query: InsuranceQueryDto,
  ): Promise<{ items: ProjectInsurance[]; total: number }> {
    const where: FindOptionsWhere<ProjectInsurance> = {};

    if (query.projectId) where.projectId = query.projectId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status as ProjectInsurance["status"];

    const qb = this.insuranceRepository.createQueryBuilder("ins").where(where);

    if (query.expiringWithin30Days) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      qb.andWhere("ins.expiryDate <= :futureDate", { futureDate });
      qb.andWhere("ins.expiryDate >= :today", { today: new Date() });
      qb.andWhere("ins.status = :status", { status: "active" });
    }

    qb.orderBy("ins.expiryDate", "ASC");

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string): Promise<ProjectInsurance> {
    const insurance = await this.insuranceRepository.findOne({ where: { id } });
    if (!insurance) throw new NotFoundException(`Insurance ${id} not found`);
    return insurance;
  }

  async findByProject(projectId: string): Promise<ProjectInsurance[]> {
    return this.insuranceRepository.find({
      where: { projectId },
      order: { expiryDate: "ASC" },
    });
  }

  async create(dto: CreateInsuranceDto): Promise<ProjectInsurance> {
    const insurance = this.insuranceRepository.create({
      ...dto,
      effectiveDate: new Date(dto.effectiveDate),
      expiryDate: new Date(dto.expiryDate),
      status: "pending",
    });
    return this.insuranceRepository.save(insurance);
  }

  async update(id: string, dto: UpdateInsuranceDto): Promise<ProjectInsurance> {
    const insurance = await this.findOne(id);
    Object.assign(insurance, dto);
    if (dto.effectiveDate)
      insurance.effectiveDate = new Date(dto.effectiveDate);
    if (dto.expiryDate) insurance.expiryDate = new Date(dto.expiryDate);
    return this.insuranceRepository.save(insurance);
  }

  async remove(id: string): Promise<void> {
    const insurance = await this.findOne(id);
    await this.insuranceRepository.remove(insurance);
  }

  // Claims management
  async addClaim(id: string, dto: AddClaimDto): Promise<ProjectInsurance> {
    const insurance = await this.findOne(id);
    const claim: InsuranceClaim = {
      ...dto,
      status: "reported",
    };
    insurance.claims = [...(insurance.claims || []), claim];
    insurance.status = "claimed";
    return this.insuranceRepository.save(insurance);
  }

  async updateClaimStatus(
    id: string,
    claimNumber: string,
    status: InsuranceClaim["status"],
    settledAmount?: number,
  ): Promise<ProjectInsurance> {
    const insurance = await this.findOne(id);
    const claim = insurance.claims?.find((c) => c.claimNumber === claimNumber);
    if (!claim) throw new NotFoundException(`Claim ${claimNumber} not found`);

    claim.status = status;
    if (settledAmount !== undefined) claim.settledAmount = settledAmount;
    if (status === "settled") claim.settledDate = new Date().toISOString();

    return this.insuranceRepository.save(insurance);
  }

  // Expiring insurance check (for scheduled jobs)
  async getExpiringInsurance(
    daysAhead: number = 30,
  ): Promise<ProjectInsurance[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.insuranceRepository.find({
      where: {
        status: "active",
        expiryDate: LessThanOrEqual(futureDate),
        reminderEnabled: true,
      },
    });
  }

  // Rate reference
  async getRates(
    insuranceType?: string,
    constructionType?: string,
  ): Promise<InsuranceRateReference[]> {
    const where: FindOptionsWhere<InsuranceRateReference> = { isActive: true };
    if (insuranceType)
      where.insuranceType =
        insuranceType as InsuranceRateReference["insuranceType"];
    if (constructionType) where.constructionType = constructionType;
    return this.rateRepository.find({ where });
  }
}
