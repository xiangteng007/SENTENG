import { Module } from "@nestjs/common";
import { TenantsModule } from "./tenants/tenants.module";
import { SitesModule } from "./sites/sites.module";
import { DmsModule } from "./dms/dms.module";
import { AuditModule } from "./audit/audit.module";
import { RbacModule } from "./rbac/rbac.module";

/**
 * PlatformModule
 *
 * 平台核心模組，包含：
 * - Tenants: 多事業體架構 (LegalEntity, BusinessUnit, CostCenter)
 * - Sites: 作業現場管理 (JobSite)
 * - DMS: 文件管理系統 (Document, DocumentVersion, MediaAsset)
 * - Audit: 稽核日誌 (AuditLog)
 * - RBAC: 角色權限管理 (Role, Permission, UserRole)
 */
@Module({
  imports: [TenantsModule, SitesModule, DmsModule, AuditModule, RbacModule],
  exports: [TenantsModule, SitesModule, DmsModule, AuditModule, RbacModule],
})
export class PlatformModule {}
