import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalEntity, BusinessUnit, CostCenter } from './entities';
import {
  CreateLegalEntityDto,
  UpdateLegalEntityDto,
  CreateBusinessUnitDto,
  UpdateBusinessUnitDto,
} from './dto/tenants.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(LegalEntity)
    private readonly legalEntityRepo: Repository<LegalEntity>,
    @InjectRepository(BusinessUnit)
    private readonly businessUnitRepo: Repository<BusinessUnit>,
    @InjectRepository(CostCenter)
    private readonly costCenterRepo: Repository<CostCenter>
  ) {}

  // ========== Legal Entity ==========

  async findAllLegalEntities(): Promise<LegalEntity[]> {
    return this.legalEntityRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findLegalEntityById(id: string): Promise<LegalEntity> {
    const entity = await this.legalEntityRepo.findOne({
      where: { id },
      relations: ['businessUnits'],
    });
    if (!entity) {
      throw new NotFoundException(`LegalEntity ${id} not found`);
    }
    return entity;
  }

  async createLegalEntity(dto: CreateLegalEntityDto): Promise<LegalEntity> {
    const entity = this.legalEntityRepo.create(dto);
    return this.legalEntityRepo.save(entity);
  }

  async updateLegalEntity(id: string, dto: UpdateLegalEntityDto): Promise<LegalEntity> {
    const entity = await this.findLegalEntityById(id);
    Object.assign(entity, dto);
    return this.legalEntityRepo.save(entity);
  }

  // ========== Business Unit ==========

  async findAllBusinessUnits(legalEntityId?: string): Promise<BusinessUnit[]> {
    const where: any = { isActive: true };
    if (legalEntityId) {
      where.legalEntityId = legalEntityId;
    }
    return this.businessUnitRepo.find({
      where,
      relations: ['legalEntity'],
      order: { code: 'ASC' },
    });
  }

  async findBusinessUnitById(id: string): Promise<BusinessUnit> {
    const bu = await this.businessUnitRepo.findOne({
      where: { id },
      relations: ['legalEntity'],
    });
    if (!bu) {
      throw new NotFoundException(`BusinessUnit ${id} not found`);
    }
    return bu;
  }

  async createBusinessUnit(dto: CreateBusinessUnitDto): Promise<BusinessUnit> {
    // Verify legal entity exists
    await this.findLegalEntityById(dto.legalEntityId);
    const bu = this.businessUnitRepo.create(dto);
    return this.businessUnitRepo.save(bu);
  }

  async updateBusinessUnit(id: string, dto: UpdateBusinessUnitDto): Promise<BusinessUnit> {
    const bu = await this.findBusinessUnitById(id);
    Object.assign(bu, dto);
    return this.businessUnitRepo.save(bu);
  }

  // ========== Cost Center ==========

  async findCostCentersByBusinessUnit(businessUnitId: string): Promise<CostCenter[]> {
    return this.costCenterRepo.find({
      where: { businessUnitId, isActive: true },
      order: { code: 'ASC' },
    });
  }
}
