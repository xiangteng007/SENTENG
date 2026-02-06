import { Injectable, NotFoundException } from "@nestjs/common";
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
  constructor(
    @InjectRepository(Partner)
    private readonly partnerRepo: Repository<Partner>,
    @InjectRepository(PartnerContact)
    private readonly contactRepo: Repository<PartnerContact>,
  ) {}

  // ============ Partner CRUD ============

  async findAll(query: PartnerQueryDto): Promise<Partner[]> {
    const where: Record<string, unknown> = {};

    if (query.type) {
      where.type = query.type;
    }
    if (query.category) {
      where.category = query.category;
    }

    const partners = await this.partnerRepo.find({
      where: query.search
        ? [
            { ...where, name: Like(`%${query.search}%`) },
            { ...where, phone: Like(`%${query.search}%`) },
            { ...where, email: Like(`%${query.search}%`) },
          ]
        : where,
      relations: ["contacts"],
      order: { createdAt: "DESC" },
    });

    return partners;
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
      syncStatus: SyncStatus.PENDING,
    });

    const saved = await this.partnerRepo.save(partner);

    // 觸發 Google 同步（異步）
    this.triggerGoogleSync(saved.id).catch((err) =>
      console.error("Google sync failed:", err),
    );

    return saved;
  }

  async update(id: string, dto: UpdatePartnerDto): Promise<Partner> {
    const partner = await this.findOne(id);
    Object.assign(partner, dto);
    partner.syncStatus = SyncStatus.PENDING;

    const saved = await this.partnerRepo.save(partner);

    // 觸發 Google 同步（異步）
    this.triggerGoogleSync(saved.id).catch((err) =>
      console.error("Google sync failed:", err),
    );

    return saved;
  }

  async remove(id: string): Promise<void> {
    const partner = await this.findOne(id);
    await this.partnerRepo.softRemove(partner);
    // TODO: Remove from Google Contacts
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
      syncStatus: SyncStatus.PENDING,
    });

    const saved = await this.contactRepo.save(contact);

    // 觸發 Google 同步
    this.triggerContactGoogleSync(saved.id).catch((err) =>
      console.error("Contact sync failed:", err),
    );

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

    // 觸發 Google 同步
    this.triggerContactGoogleSync(saved.id).catch((err) =>
      console.error("Contact sync failed:", err),
    );

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
  }

  // ============ Google Sync ============

  private async triggerGoogleSync(partnerId: string): Promise<void> {
    // TODO: Integrate with ContactsSyncService
    // For now, just mark as synced after a delay (simulating async sync)
    setTimeout(async () => {
      try {
        await this.partnerRepo.update(partnerId, {
          syncStatus: SyncStatus.SYNCED,
          lastSyncedAt: new Date(),
        });
      } catch (err) {
        console.error("Failed to update sync status:", err);
      }
    }, 1000);
  }

  private async triggerContactGoogleSync(contactId: string): Promise<void> {
    // TODO: Integrate with ContactsSyncService
    setTimeout(async () => {
      try {
        await this.contactRepo.update(contactId, {
          syncStatus: SyncStatus.SYNCED,
          lastSyncedAt: new Date(),
        });
      } catch (err) {
        console.error("Failed to update contact sync status:", err);
      }
    }, 1000);
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
