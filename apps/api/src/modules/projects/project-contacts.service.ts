import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProjectContact, ProjectContactSourceType } from "./project-contact.entity";
import { CreateProjectContactDto, UpdateProjectContactDto, ProjectContactResponseDto } from "./project-contact.dto";
// Unified Partner contacts (new system)
import { PartnerContact } from "../partners/partner-contact.entity";
// Legacy contacts (deprecated - kept for backward compatibility)
import { Contact } from "../contacts/contact.entity";
import { CustomerContact } from "../customers/customer-contact.entity";
import { VendorContact } from "../supply-chain/vendors/vendor-contact.entity";

@Injectable()
export class ProjectContactsService {
  constructor(
    @InjectRepository(ProjectContact)
    private readonly projectContactRepo: Repository<ProjectContact>,
    @InjectRepository(PartnerContact)
    private readonly partnerContactRepo: Repository<PartnerContact>,
    // Legacy repositories (deprecated)
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(CustomerContact)
    private readonly customerContactRepo: Repository<CustomerContact>,
    @InjectRepository(VendorContact)
    private readonly vendorContactRepo: Repository<VendorContact>,
  ) {}

  /**
   * 取得專案所有聯絡人（含完整聯絡資訊）
   */
  async findByProject(projectId: string): Promise<ProjectContactResponseDto[]> {
    const projectContacts = await this.projectContactRepo.find({
      where: { projectId },
      order: { isPrimary: "DESC", createdAt: "ASC" },
    });

    // 逐一填充聯絡人資訊
    const results: ProjectContactResponseDto[] = [];
    for (const pc of projectContacts) {
      const contactInfo = await this.getContactInfo(pc.contactId, pc.sourceType);
      results.push({
        ...pc,
        contact: contactInfo,
      });
    }

    return results;
  }

  /**
   * 指派聯絡人到專案
   */
  async assignContact(
    projectId: string,
    dto: CreateProjectContactDto,
    userId?: string,
  ): Promise<ProjectContact> {
    // 檢查是否已存在
    const existing = await this.projectContactRepo.findOne({
      where: {
        projectId,
        contactId: dto.contactId,
        sourceType: dto.sourceType,
      },
    });

    if (existing) {
      throw new ConflictException("此聯絡人已指派到該專案");
    }

    // 驗證聯絡人存在
    const contactExists = await this.verifyContactExists(dto.contactId, dto.sourceType);
    if (!contactExists) {
      throw new NotFoundException("找不到指定的聯絡人");
    }

    const projectContact = this.projectContactRepo.create({
      projectId,
      ...dto,
      createdBy: userId,
    });

    return this.projectContactRepo.save(projectContact);
  }

  /**
   * 更新專案聯絡人
   */
  async update(
    projectId: string,
    contactAssignmentId: string,
    dto: UpdateProjectContactDto,
  ): Promise<ProjectContact> {
    const projectContact = await this.projectContactRepo.findOne({
      where: { id: contactAssignmentId, projectId },
    });

    if (!projectContact) {
      throw new NotFoundException("找不到專案聯絡人");
    }

    Object.assign(projectContact, dto);
    return this.projectContactRepo.save(projectContact);
  }

  /**
   * 移除專案聯絡人
   */
  async remove(projectId: string, contactAssignmentId: string): Promise<void> {
    const result = await this.projectContactRepo.delete({
      id: contactAssignmentId,
      projectId,
    });

    if (result.affected === 0) {
      throw new NotFoundException("找不到專案聯絡人");
    }
  }

  /**
   * 取得聯絡人詳細資訊（依來源類型）
   */
  private async getContactInfo(
    contactId: string,
    sourceType: ProjectContactSourceType,
  ): Promise<ProjectContactResponseDto["contact"] | undefined> {
    switch (sourceType) {
      case ProjectContactSourceType.PARTNER: {
        const contact = await this.partnerContactRepo.findOne({ where: { id: contactId } });
        if (!contact) return undefined;
        return {
          name: contact.name,
          phone: contact.phone,
          mobile: contact.mobile,
          email: contact.email,
          title: contact.title,
          lineId: contact.lineId,
          syncStatus: contact.syncStatus,
        };
      }
      case ProjectContactSourceType.UNIFIED: {
        const contact = await this.contactRepo.findOne({ where: { id: contactId } });
        if (!contact) return undefined;
        return {
          name: contact.name,
          phone: contact.phone,
          mobile: contact.mobile,
          email: contact.email,
          title: contact.title,
          lineId: contact.lineId,
          syncStatus: contact.syncStatus,
        };
      }
      case ProjectContactSourceType.CUSTOMER: {
        const contact = await this.customerContactRepo.findOne({ where: { id: contactId } });
        if (!contact) return undefined;
        return {
          name: contact.name,
          phone: contact.phone,
          mobile: null,
          email: contact.email,
          title: contact.title,
          lineId: contact.lineId,
          syncStatus: contact.syncStatus,
        };
      }
      case ProjectContactSourceType.VENDOR: {
        const contact = await this.vendorContactRepo.findOne({ where: { id: contactId } });
        if (!contact) return undefined;
        return {
          name: contact.fullName,
          phone: contact.phone,
          mobile: contact.mobile,
          email: contact.email,
          title: contact.title,
          lineId: contact.lineId,
          syncStatus: contact.syncStatus,
        };
      }
      default:
        return undefined;
    }
  }

  /**
   * 驗證聯絡人存在
   */
  private async verifyContactExists(
    contactId: string,
    sourceType: ProjectContactSourceType,
  ): Promise<boolean> {
    switch (sourceType) {
      case ProjectContactSourceType.PARTNER:
        return !!(await this.partnerContactRepo.findOne({ where: { id: contactId } }));
      case ProjectContactSourceType.UNIFIED:
        return !!(await this.contactRepo.findOne({ where: { id: contactId } }));
      case ProjectContactSourceType.CUSTOMER:
        return !!(await this.customerContactRepo.findOne({ where: { id: contactId } }));
      case ProjectContactSourceType.VENDOR:
        return !!(await this.vendorContactRepo.findOne({ where: { id: contactId } }));
      default:
        return false;
    }
  }
}
