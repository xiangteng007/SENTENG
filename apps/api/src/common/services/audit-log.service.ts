import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * 審計日誌實體
 */
@Entity("audit_logs")
@Index(["entityType", "entityId"])
@Index(["userId", "createdAt"])
@Index(["action", "createdAt"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 50 })
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "VIEW"
    | "EXPORT"
    | "LOGIN"
    | "LOGOUT";

  @Column({ length: 100 })
  entityType: string;

  @Column({ length: 100, nullable: true })
  entityId: string;

  @Column({ length: 100, nullable: true })
  entityName: string;

  @Column({ type: "uuid", nullable: true })
  userId: string;

  @Column({ length: 255, nullable: true })
  userEmail: string;

  @Column({ length: 100, nullable: true })
  userName: string;

  @Column({ type: "jsonb", nullable: true })
  oldValue: Record<string, unknown>;

  @Column({ type: "jsonb", nullable: true })
  newValue: Record<string, unknown>;

  @Column({ type: "jsonb", nullable: true })
  changes: { field: string; oldValue: unknown; newValue: unknown }[];

  @Column({ length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: "text", nullable: true })
  userAgent: string;

  @Column({ length: 255, nullable: true })
  requestPath: string;

  @Column({ length: 10, nullable: true })
  requestMethod: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}

/**
 * 審計日誌服務
 *
 * 提供系統操作追蹤與安全稽核功能
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  /**
   * 記錄新增操作
   */
  async logCreate(
    entityType: string,
    entityId: string,
    entityName: string,
    newValue: Record<string, unknown>,
    context: AuditContext,
  ): Promise<void> {
    await this.log({
      action: "CREATE",
      entityType,
      entityId,
      entityName,
      newValue,
      description: `新增 ${entityType}: ${entityName}`,
      ...context,
    });
  }

  /**
   * 記錄更新操作
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    entityName: string,
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>,
    context: AuditContext,
  ): Promise<void> {
    const changes = this.computeChanges(oldValue, newValue);

    await this.log({
      action: "UPDATE",
      entityType,
      entityId,
      entityName,
      oldValue,
      newValue,
      changes,
      description: `修改 ${entityType}: ${entityName} (${changes.length} 個欄位)`,
      ...context,
    });
  }

  /**
   * 記錄刪除操作
   */
  async logDelete(
    entityType: string,
    entityId: string,
    entityName: string,
    oldValue: Record<string, unknown>,
    context: AuditContext,
  ): Promise<void> {
    await this.log({
      action: "DELETE",
      entityType,
      entityId,
      entityName,
      oldValue,
      description: `刪除 ${entityType}: ${entityName}`,
      ...context,
    });
  }

  /**
   * 記錄匯出操作
   */
  async logExport(
    entityType: string,
    recordCount: number,
    context: AuditContext,
  ): Promise<void> {
    await this.log({
      action: "EXPORT",
      entityType,
      description: `匯出 ${recordCount} 筆 ${entityType} 資料`,
      ...context,
    });
  }

  /**
   * 記錄登入
   */
  async logLogin(context: AuditContext): Promise<void> {
    await this.log({
      action: "LOGIN",
      entityType: "Session",
      description: "使用者登入",
      ...context,
    });
  }

  /**
   * 記錄登出
   */
  async logLogout(context: AuditContext): Promise<void> {
    await this.log({
      action: "LOGOUT",
      entityType: "Session",
      description: "使用者登出",
      ...context,
    });
  }

  /**
   * 查詢審計日誌
   */
  async findAll(params: AuditLogQuery): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      entityType,
      userId,
      action,
      startDate,
      endDate,
    } = params;

    const qb = this.auditLogRepo.createQueryBuilder("log");

    if (entityType) {
      qb.andWhere("log.entityType = :entityType", { entityType });
    }

    if (userId) {
      qb.andWhere("log.userId = :userId", { userId });
    }

    if (action) {
      qb.andWhere("log.action = :action", { action });
    }

    if (startDate) {
      qb.andWhere("log.createdAt >= :startDate", { startDate });
    }

    if (endDate) {
      qb.andWhere("log.createdAt <= :endDate", { endDate });
    }

    qb.orderBy("log.createdAt", "DESC");
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * 取得實體變更歷程
   */
  async getEntityHistory(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogRepo.find({
      where: { entityType, entityId },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * 內部日誌方法
   */
  private async log(data: Partial<AuditLog>): Promise<void> {
    try {
      const log = this.auditLogRepo.create(data);
      await this.auditLogRepo.save(log);
    } catch (error) {
      this.logger.error(`Audit log failed: ${error}`);
    }
  }

  /**
   * 計算變更欄位
   */
  private computeChanges(
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>,
  ): { field: string; oldValue: unknown; newValue: unknown }[] {
    const changes: { field: string; oldValue: unknown; newValue: unknown }[] =
      [];
    const allKeys = new Set([
      ...Object.keys(oldValue),
      ...Object.keys(newValue),
    ]);

    for (const key of allKeys) {
      if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) {
        changes.push({
          field: key,
          oldValue: oldValue[key],
          newValue: newValue[key],
        });
      }
    }

    return changes;
  }
}

/**
 * 審計上下文
 */
export interface AuditContext {
  userId?: string;
  userEmail?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
}

/**
 * 審計查詢參數
 */
export interface AuditLogQuery {
  page?: number;
  limit?: number;
  entityType?: string;
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}
