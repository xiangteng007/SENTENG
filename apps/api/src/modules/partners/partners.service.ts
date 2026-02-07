import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, In } from "typeorm";
import { Partner, PartnerType, SyncStatus } from "./partner.entity";
import { PartnerContact } from "./partner-contact.entity";
import {
  CreatePartnerDto,
  UpdatePartnerDto,
  CreatePartnerContactDto,
  UpdatePartnerContactDto,
  PartnerQueryDto,
} from "./partner.dto";

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(
    @InjectRepository(Partner)
    private readonly partnerRepo: Repository<Partner>,
    @InjectRepository(PartnerContact)
    private readonly contactRepo: Repository<PartnerContact>,
  ) {}

  // ============ Partner CRUD ============

  async findAll(query: PartnerQueryDto): Promise<{
    items: Partner[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 50, search, type, category } = query;
    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }
    if (category) {
      where.category = category;
    }

    const [items, total] = await this.partnerRepo.findAndCount({
      where: search
        ? [
            { ...where, name: Like(`%${search}%`) },
            { ...where, phone: Like(`%${search}%`) },
            { ...where, email: Like(`%${search}%`) },
          ]
        : where,
      relations: ["contacts"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<Partner> {
    const partner = await this.partnerRepo.findOne({
      where: { id },
      relations: ["contacts"],
    });

    if (!partner) {
      throw new NotFoundException("找不到合作夥伴");
    }

    return partner;
  }

  async create(dto: CreatePartnerDto, userId?: string): Promise<Partner> {
    const partner = this.partnerRepo.create({
      ...dto,
      contacts: dto.contacts?.map((c) => this.contactRepo.create(c)),
      createdBy: userId,
      syncStatus: SyncStatus.UNSYNCED,
    });

    const saved = await this.partnerRepo.save(partner);

    // TODO: Integrate with ContactsSyncService for real Google sync
    this.logger.log(`Partner created: ${saved.id} (${saved.name})`);

    return saved;
  }

  async update(id: string, dto: UpdatePartnerDto): Promise<Partner> {
    const partner = await this.findOne(id);
    Object.assign(partner, dto);
    partner.syncStatus = SyncStatus.PENDING;

    const saved = await this.partnerRepo.save(partner);

    // TODO: Integrate with ContactsSyncService for real Google sync
    this.logger.log(`Partner updated: ${saved.id} (${saved.name})`);

    return saved;
  }

  async remove(id: string): Promise<void> {
    const partner = await this.findOne(id);
    await this.partnerRepo.softRemove(partner);
    // TODO: Remove from Google Contacts
    this.logger.log(`Partner soft-deleted: ${id}`);
  }

  // ============ PartnerContact CRUD ============

  async addContact(
    partnerId: string,
    dto: CreatePartnerContactDto,
    userId?: string,
  ): Promise<PartnerContact> {
    await this.findOne(partnerId); // Verify partner exists

    const contact = this.contactRepo.create({
      ...dto,
      partnerId,
      createdBy: userId,
      syncStatus: SyncStatus.UNSYNCED,
    });

    const saved = await this.contactRepo.save(contact);

    // TODO: Integrate with ContactsSyncService for real Google sync
    this.logger.log(`Contact added to partner ${partnerId}: ${saved.id}`);

    return saved;
  }

  async updateContact(
    partnerId: string,
    contactId: string,
    dto: UpdatePartnerContactDto,
  ): Promise<PartnerContact> {
    const contact = await this.contactRepo.findOne({
      where: { id: contactId, partnerId },
    });

    if (!contact) {
      throw new NotFoundException("找不到聯絡人");
    }

    Object.assign(contact, dto);
    contact.syncStatus = SyncStatus.PENDING;

    const saved = await this.contactRepo.save(contact);

    // TODO: Integrate with ContactsSyncService for real Google sync
    this.logger.log(`Contact updated: ${saved.id}`);

    return saved;
  }

  async removeContact(partnerId: string, contactId: string): Promise<void> {
    const contact = await this.contactRepo.findOne({
      where: { id: contactId, partnerId },
    });

    if (!contact) {
      throw new NotFoundException("找不到聯絡人");
    }

    await this.contactRepo.remove(contact);
    // TODO: Remove from Google Contacts
    this.logger.log(`Contact removed: ${contactId}`);
  }

  // ============ Helpers ============

  async findByType(type: PartnerType): Promise<Partner[]> {
    return this.partnerRepo.find({
      where: { type },
      relations: ["contacts"],
      order: { name: "ASC" },
    });
  }

  async getClients(): Promise<Partner[]> {
    return this.findByType(PartnerType.CLIENT);
  }

  async getVendors(): Promise<Partner[]> {
    return this.findByType(PartnerType.VENDOR);
  }
}
