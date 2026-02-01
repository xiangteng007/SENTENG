import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Vendor, VendorStatus } from "./vendor.entity";
import { VendorContact } from "./vendor-contact.entity";
import { VendorTrade } from "./vendor-trade.entity";
import {
  CreateVendorDto,
  UpdateVendorDto,
  VendorQueryDto,
  AddTradeDto,
} from "./vendor.dto";
import { isAdminRole } from "../../../common/constants/roles";
import { IdGeneratorService, checkResourceOwnership } from "../../../core";

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepo: Repository<Vendor>,
    @InjectRepository(VendorContact)
    private contactRepo: Repository<VendorContact>,
    @InjectRepository(VendorTrade)
    private tradeRepo: Repository<VendorTrade>,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async findAll(
    query: VendorQueryDto,
    userId?: string,
    userRole?: string,
  ): Promise<{ items: Vendor[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      status,
      vendorType,
      tradeCode,
      search,
      tag,
    } = query;
    const qb = this.vendorRepo
      .createQueryBuilder("v")
      .leftJoinAndSelect("v.trades", "trades");

    if (status) qb.andWhere("v.status = :status", { status });
    if (vendorType) qb.andWhere("v.vendorType = :vendorType", { vendorType });
    if (tradeCode) qb.andWhere("trades.tradeCode = :tradeCode", { tradeCode });
    if (search) {
      qb.andWhere(
        "(v.name ILIKE :search OR v.shortName ILIKE :search OR v.phone ILIKE :search)",
        {
          search: `%${search}%`,
        },
      );
    }
    if (tag) qb.andWhere(":tag = ANY(v.tags)", { tag });

    // IDOR for non-admin
    if (userId && userRole && !isAdminRole(userRole)) {
      qb.andWhere("v.createdBy = :userId", { userId });
    }

    const [items, total] = await qb
      .orderBy("v.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findOne(
    id: string,
    userId?: string,
    userRole?: string,
  ): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOne({
      where: { id },
      relations: ["contacts", "trades"],
    });
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    checkResourceOwnership(vendor, userId, userRole, "vendor");
    return vendor;
  }

  async findProjects(vendorId: string): Promise<any[]> {
    // Will integrate with ProjectVendor table
    return [];
  }

  async create(dto: CreateVendorDto, userId?: string): Promise<Vendor> {
    const id = await this.idGenerator.generateForTable("vendors", "VND");
    const { trades, ...vendorData } = dto;

    const vendor = this.vendorRepo.create({
      ...vendorData,
      id,
      createdBy: userId,
    });
    const saved = await this.vendorRepo.save(vendor);

    // Add trades if provided
    if (trades?.length) {
      for (const t of trades) {
        await this.tradeRepo.save(
          this.tradeRepo.create({ ...t, vendorId: id }),
        );
      }
    }

    return this.findOne(id);
  }

  async update(
    id: string,
    dto: UpdateVendorDto,
    userId?: string,
    userRole?: string,
  ): Promise<Vendor> {
    const vendor = await this.findOne(id, userId, userRole);
    Object.assign(vendor, dto, { updatedBy: userId });
    return this.vendorRepo.save(vendor);
  }

  async blacklist(
    id: string,
    reason: string,
    userId?: string,
  ): Promise<Vendor> {
    const vendor = await this.findOne(id);
    vendor.status = VendorStatus.BLACKLISTED;
    vendor.blacklistReason = reason;
    vendor.updatedBy = userId ?? null;
    return this.vendorRepo.save(vendor);
  }

  async activate(id: string, userId?: string): Promise<Vendor> {
    const vendor = await this.findOne(id);
    vendor.status = VendorStatus.ACTIVE;
    vendor.blacklistReason = null;
    vendor.updatedBy = userId ?? null;
    return this.vendorRepo.save(vendor);
  }

  async remove(id: string, userId?: string, userRole?: string): Promise<void> {
    const vendor = await this.findOne(id, userId, userRole);
    await this.vendorRepo.softRemove(vendor);
  }

  // Trade management
  async addTrade(vendorId: string, dto: AddTradeDto): Promise<VendorTrade> {
    await this.findOne(vendorId);
    const trade = this.tradeRepo.create({ ...dto, vendorId });
    return this.tradeRepo.save(trade);
  }

  async removeTrade(tradeId: string): Promise<void> {
    await this.tradeRepo.delete(tradeId);
  }

  async updateRating(
    id: string,
    rating: number,
    userId?: string,
  ): Promise<Vendor> {
    const vendor = await this.findOne(id);
    vendor.rating = rating;
    vendor.updatedBy = userId ?? null;
    return this.vendorRepo.save(vendor);
  }

  // checkOwnership and generateId moved to Core Layer
}
