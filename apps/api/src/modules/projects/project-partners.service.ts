/**
 * ProjectPartnersService
 *
 * 專案合作夥伴關聯 CRUD 服務
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProjectPartner, ProjectPartnerRole } from "./project-partner.entity";
import { Partner } from "../partners/partner.entity";
import {
  CreateProjectPartnerDto,
  UpdateProjectPartnerDto,
} from "./project-partners.dto";

// Re-export DTOs for backward compatibility
export { CreateProjectPartnerDto, UpdateProjectPartnerDto };

@Injectable()
export class ProjectPartnersService {
  constructor(
    @InjectRepository(ProjectPartner)
    private readonly projectPartnerRepository: Repository<ProjectPartner>,
    @InjectRepository(Partner)
    private readonly partnerRepository: Repository<Partner>,
  ) {}

  /**
   * 取得專案的所有合作夥伴
   */
  async findByProject(projectId: string): Promise<ProjectPartner[]> {
    return this.projectPartnerRepository.find({
      where: { projectId },
      relations: ["partner"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * 依 ID 取得單一關聯
   */
  async findOne(id: string): Promise<ProjectPartner> {
    const pp = await this.projectPartnerRepository.findOne({
      where: { id },
      relations: ["partner"],
    });
    if (!pp) {
      throw new NotFoundException(`ProjectPartner ${id} not found`);
    }
    return pp;
  }

  /**
   * 新增專案合作夥伴關聯
   */
  async create(
    dto: CreateProjectPartnerDto,
    userId?: string,
  ): Promise<ProjectPartner> {
    // 驗證 Partner 存在
    const partner = await this.partnerRepository.findOne({
      where: { id: dto.partnerId },
    });
    if (!partner) {
      throw new NotFoundException(`Partner ${dto.partnerId} not found`);
    }

    const pp = this.projectPartnerRepository.create({
      ...dto,
      createdBy: userId,
    });
    return this.projectPartnerRepository.save(pp);
  }

  /**
   * 更新專案合作夥伴關聯
   */
  async update(
    id: string,
    dto: UpdateProjectPartnerDto,
  ): Promise<ProjectPartner> {
    const pp = await this.findOne(id);
    Object.assign(pp, dto);
    return this.projectPartnerRepository.save(pp);
  }

  /**
   * 刪除專案合作夥伴關聯
   */
  async remove(id: string): Promise<void> {
    const pp = await this.findOne(id);
    await this.projectPartnerRepository.remove(pp);
  }

  /**
   * 批量新增專案合作夥伴
   */
  async bulkCreate(
    projectId: string,
    partnerIds: string[],
    role: ProjectPartnerRole = ProjectPartnerRole.CONTRACTOR,
    userId?: string,
  ): Promise<ProjectPartner[]> {
    const results: ProjectPartner[] = [];
    for (const partnerId of partnerIds) {
      try {
        const pp = await this.create({ projectId, partnerId, role }, userId);
        results.push(pp);
      } catch {
        // 跳過已存在的關聯
      }
    }
    return results;
  }
}
