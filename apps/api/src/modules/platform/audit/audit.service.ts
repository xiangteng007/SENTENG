import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "./entities";

export interface AuditContext {
  userId?: string;
  userEmail?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  /**
   * 記錄建立操作
   */
  async logCreate(
    entityType: string,
    entityId: string,
    newValues: any,
    context?: AuditContext,
  ): Promise<AuditLog> {
    return this.createLog(
      "CREATE",
      entityType,
      entityId,
      null,
      newValues,
      context,
    );
  }

  /**
   * 記錄更新操作
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    oldValues: any,
    newValues: any,
    context?: AuditContext,
  ): Promise<AuditLog> {
    const changedFields = this.detectChangedFields(oldValues, newValues);
    return this.createLog(
      "UPDATE",
      entityType,
      entityId,
      oldValues,
      newValues,
      context,
      changedFields,
    );
  }

  /**
   * 記錄刪除操作
   */
  async logDelete(
    entityType: string,
    entityId: string,
    oldValues: any,
    context?: AuditContext,
  ): Promise<AuditLog> {
    return this.createLog(
      "DELETE",
      entityType,
      entityId,
      oldValues,
      null,
      context,
    );
  }

  /**
   * 記錄狀態變更
   */
  async logStatusChange(
    entityType: string,
    entityId: string,
    oldStatus: string,
    newStatus: string,
    context?: AuditContext,
  ): Promise<AuditLog> {
    return this.createLog(
      "STATUS_CHANGE",
      entityType,
      entityId,
      { status: oldStatus },
      { status: newStatus },
      context,
      ["status"],
    );
  }

  /**
   * 查詢實體的審計歷史
   */
  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogRepo.find({
      where: { entityType, entityId },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * 查詢用戶的操作歷史
   */
  async findByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepo.find({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  private async createLog(
    action: string,
    entityType: string,
    entityId: string,
    oldValues: any,
    newValues: any,
    context?: AuditContext,
    changedFields?: string[],
  ): Promise<AuditLog> {
    const log = this.auditLogRepo.create({
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      changedFields,
      userId: context?.userId,
      userEmail: context?.userEmail,
      userName: context?.userName,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
    return this.auditLogRepo.save(log);
  }

  private detectChangedFields(oldValues: any, newValues: any): string[] {
    if (!oldValues || !newValues) return [];

    const changed: string[] = [];
    const allKeys = new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {}),
    ]);

    for (const key of allKeys) {
      if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
        changed.push(key);
      }
    }
    return changed;
  }
}
