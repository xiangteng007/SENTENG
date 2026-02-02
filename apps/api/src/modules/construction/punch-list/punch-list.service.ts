/**
 * Punch List Resolution Service
 * ACC-003: 驗收缺失覆驗流程
 *
 * 完整閉環流程：發現 → 改善 → 覆驗 → 結案
 */

import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { PunchListItem } from "./entities/punch-list-item.entity";

// ============================================
// Types
// ============================================

export interface CreatePunchListDto {
  projectId: string;
  acceptanceRecordId?: string;
  description: string;
  location?: string;
  category?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  responsibleParty?: string;
  dueDate?: Date;
  defectPhotos?: PhotoInfo[];
}

export interface ResolvePunchListDto {
  resolutionNotes: string;
  resolutionPhotos?: PhotoInfo[];
}

export interface VerifyPunchListDto {
  passed: boolean;
  notes?: string;
}

export interface PhotoInfo {
  url: string;
  caption?: string;
  takenAt?: Date;
}

export interface PunchListStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  verified: number;
  waived: number;
  bySeverity: Record<string, number>;
  overdueCount: number;
}

// ============================================
// Service Implementation
// ============================================

@Injectable()
export class PunchListService {
  constructor(
    @InjectRepository(PunchListItem)
    private readonly punchListRepo: Repository<PunchListItem>,
  ) {}

  /**
   * 新增缺失項目
   */
  async create(dto: CreatePunchListDto, userId: string): Promise<PunchListItem> {
    // 生成流水號
    const count = await this.punchListRepo.count({
      where: { projectId: dto.projectId },
    });

    const itemNumber = `PL-${dto.projectId.substring(0, 4).toUpperCase()}-${String(count + 1).padStart(4, "0")}`;

    const item = this.punchListRepo.create({
      ...dto,
      itemNumber,
      status: "OPEN",
      severity: dto.severity || "MEDIUM",
      createdBy: userId,
    });

    return this.punchListRepo.save(item);
  }

  /**
   * 取得專案的所有缺失項目
   */
  async findByProject(
    projectId: string,
    filters?: {
      status?: string;
      severity?: string;
      acceptanceRecordId?: string;
    },
  ): Promise<PunchListItem[]> {
    const where: any = { projectId };

    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.acceptanceRecordId) where.acceptanceRecordId = filters.acceptanceRecordId;

    return this.punchListRepo.find({
      where,
      order: { createdAt: "DESC" },
    });
  }

  /**
   * 取得單一缺失項目
   */
  async findOne(id: string): Promise<PunchListItem> {
    const item = await this.punchListRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Punch list item ${id} not found`);
    }
    return item;
  }

  /**
   * 開始處理（改善中）
   */
  async startResolution(id: string, userId: string): Promise<PunchListItem> {
    const item = await this.findOne(id);

    if (item.status !== "OPEN") {
      throw new BadRequestException("只有 OPEN 狀態的項目可以開始處理");
    }

    item.status = "IN_PROGRESS";
    return this.punchListRepo.save(item);
  }

  /**
   * 回報已改善
   */
  async resolve(id: string, dto: ResolvePunchListDto, userId: string): Promise<PunchListItem> {
    const item = await this.findOne(id);

    if (!["OPEN", "IN_PROGRESS"].includes(item.status)) {
      throw new BadRequestException("只有 OPEN 或 IN_PROGRESS 狀態的項目可以回報改善");
    }

    item.status = "RESOLVED";
    item.resolvedAt = new Date();
    item.resolvedBy = userId;
    item.resolutionNotes = dto.resolutionNotes;
    item.resolutionPhotos = dto.resolutionPhotos;

    return this.punchListRepo.save(item);
  }

  /**
   * 覆驗
   */
  async verify(id: string, dto: VerifyPunchListDto, userId: string): Promise<PunchListItem> {
    const item = await this.findOne(id);

    if (item.status !== "RESOLVED") {
      throw new BadRequestException("只有 RESOLVED 狀態的項目可以覆驗");
    }

    if (dto.passed) {
      item.status = "VERIFIED";
      item.verifiedAt = new Date();
      item.verifiedBy = userId;
    } else {
      // 覆驗不通過，退回
      item.status = "IN_PROGRESS";
      item.resolutionNotes += `\n[${new Date().toISOString()}] 覆驗不通過: ${dto.notes || "需重新改善"}`;
    }

    return this.punchListRepo.save(item);
  }

  /**
   * 免責結案（由業主同意）
   */
  async waive(id: string, reason: string, userId: string): Promise<PunchListItem> {
    const item = await this.findOne(id);

    if (item.status === "VERIFIED" || item.status === "WAIVED") {
      throw new BadRequestException("項目已結案");
    }

    item.status = "WAIVED";
    item.resolutionNotes = `[免責] ${reason}`;
    item.resolvedBy = userId;
    item.resolvedAt = new Date();

    return this.punchListRepo.save(item);
  }

  /**
   * 取得統計
   */
  async getStats(projectId: string): Promise<PunchListStats> {
    const items = await this.findByProject(projectId);
    const now = new Date();

    const stats: PunchListStats = {
      total: items.length,
      open: 0,
      inProgress: 0,
      resolved: 0,
      verified: 0,
      waived: 0,
      bySeverity: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0,
      },
      overdueCount: 0,
    };

    items.forEach((item) => {
      // 狀態統計
      switch (item.status) {
        case "OPEN":
          stats.open++;
          break;
        case "IN_PROGRESS":
          stats.inProgress++;
          break;
        case "RESOLVED":
          stats.resolved++;
          break;
        case "VERIFIED":
          stats.verified++;
          break;
        case "WAIVED":
          stats.waived++;
          break;
      }

      // 嚴重度統計
      if (stats.bySeverity[item.severity] !== undefined) {
        stats.bySeverity[item.severity]++;
      }

      // 逾期統計
      if (item.dueDate && new Date(item.dueDate) < now && !["VERIFIED", "WAIVED"].includes(item.status)) {
        stats.overdueCount++;
      }
    });

    return stats;
  }

  /**
   * 批次更新狀態
   */
  async batchUpdateStatus(
    ids: string[],
    status: string,
    userId: string,
  ): Promise<{ updated: number }> {
    const result = await this.punchListRepo.update(
      { id: In(ids) },
      {
        status,
        ...(status === "RESOLVED" && { resolvedAt: new Date(), resolvedBy: userId }),
        ...(status === "VERIFIED" && { verifiedAt: new Date(), verifiedBy: userId }),
      },
    );

    return { updated: result.affected || 0 };
  }
}
