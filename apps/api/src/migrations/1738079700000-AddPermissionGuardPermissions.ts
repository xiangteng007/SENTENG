import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 新增所有 Controller 遷移到 PermissionGuard 所需的權限
 *
 * 這個 Migration 補齊了以下 controllers 的權限:
 * - users, storage, finance, inventory, quotations, clients, events
 * - cmm, change-orders, cost-entries, profit-analysis, client-contacts
 * - sites, tenants, integrations
 */
export class AddPermissionGuardPermissions1738079700000 implements MigrationInterface {
  name = "AddPermissionGuardPermissions1738079700000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert new permissions for all migrated controllers
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "name", "module", "action", "description") VALUES
      -- Users
      ('users:read', '檢視使用者', 'users', 'read', '允許檢視使用者資料'),
      ('users:create', '新增使用者', 'users', 'create', '允許建立使用者'),
      ('users:update', '編輯使用者', 'users', 'update', '允許編輯使用者資料'),
      ('users:delete', '刪除使用者', 'users', 'delete', '允許刪除使用者'),
      -- Storage
      ('storage:read', '檢視檔案', 'storage', 'read', '允許檢視檔案'),
      ('storage:upload', '上傳檔案', 'storage', 'upload', '允許上傳檔案'),
      ('storage:delete', '刪除檔案', 'storage', 'delete', '允許刪除檔案'),
      -- Finance
      ('finance:read', '檢視財務', 'finance', 'read', '允許檢視財務資料'),
      ('finance:create', '新增交易', 'finance', 'create', '允許建立財務交易'),
      ('finance:update', '編輯交易', 'finance', 'update', '允許編輯財務交易'),
      ('finance:delete', '刪除交易', 'finance', 'delete', '允許刪除財務交易'),
      -- Inventory
      ('inventory:read', '檢視庫存', 'inventory', 'read', '允許檢視庫存資料'),
      ('inventory:create', '新增庫存', 'inventory', 'create', '允許建立庫存品項'),
      ('inventory:update', '編輯庫存', 'inventory', 'update', '允許編輯庫存資料'),
      ('inventory:delete', '刪除庫存', 'inventory', 'delete', '允許刪除庫存品項'),
      -- Quotations
      ('quotations:read', '檢視報價', 'quotations', 'read', '允許檢視報價資料'),
      ('quotations:create', '新增報價', 'quotations', 'create', '允許建立報價單'),
      ('quotations:update', '編輯報價', 'quotations', 'update', '允許編輯報價單'),
      ('quotations:submit', '提交報價', 'quotations', 'submit', '允許提交報價單'),
      ('quotations:approve', '核准報價', 'quotations', 'approve', '允許核准報價單'),
      -- Clients
      ('clients:read', '檢視客戶', 'clients', 'read', '允許檢視客戶資料'),
      ('clients:create', '新增客戶', 'clients', 'create', '允許建立客戶'),
      ('clients:update', '編輯客戶', 'clients', 'update', '允許編輯客戶資料'),
      ('clients:delete', '刪除客戶', 'clients', 'delete', '允許刪除客戶'),
      -- Client Contacts
      ('client-contacts:read', '檢視客戶聯絡人', 'client-contacts', 'read', '允許檢視客戶聯絡人'),
      ('client-contacts:create', '新增客戶聯絡人', 'client-contacts', 'create', '允許建立客戶聯絡人'),
      ('client-contacts:update', '編輯客戶聯絡人', 'client-contacts', 'update', '允許編輯客戶聯絡人'),
      ('client-contacts:delete', '刪除客戶聯絡人', 'client-contacts', 'delete', '允許刪除客戶聯絡人'),
      -- Events
      ('events:read', '檢視事件', 'events', 'read', '允許檢視事件'),
      ('events:create', '新增事件', 'events', 'create', '允許建立事件'),
      ('events:update', '編輯事件', 'events', 'update', '允許編輯事件'),
      ('events:delete', '刪除事件', 'events', 'delete', '允許刪除事件'),
      -- CMM
      ('cmm:read', '檢視材料計算', 'cmm', 'read', '允許檢視材料計算資料'),
      ('cmm:create', '新增材料計算', 'cmm', 'create', '允許執行材料計算'),
      ('cmm:update', '編輯材料', 'cmm', 'update', '允許編輯材料資料'),
      ('cmm:admin', 'CMM 管理', 'cmm', 'admin', '允許CMM系統管理'),
      -- Change Orders
      ('change-orders:read', '檢視變更單', 'change-orders', 'read', '允許檢視變更單'),
      ('change-orders:create', '新增變更單', 'change-orders', 'create', '允許建立變更單'),
      ('change-orders:update', '編輯變更單', 'change-orders', 'update', '允許編輯變更單'),
      ('change-orders:submit', '提交變更單', 'change-orders', 'submit', '允許提交變更單'),
      ('change-orders:approve', '核准變更單', 'change-orders', 'approve', '允許核准變更單'),
      ('change-orders:reject', '駁回變更單', 'change-orders', 'reject', '允許駁回變更單'),
      -- Cost Entries
      ('cost-entries:read', '檢視成本項目', 'cost-entries', 'read', '允許檢視成本項目'),
      ('cost-entries:create', '新增成本項目', 'cost-entries', 'create', '允許建立成本項目'),
      ('cost-entries:update', '編輯成本項目', 'cost-entries', 'update', '允許編輯成本項目'),
      ('cost-entries:delete', '刪除成本項目', 'cost-entries', 'delete', '允許刪除成本項目'),
      -- Profit Analysis
      ('profit-analysis:read', '檢視利潤分析', 'profit-analysis', 'read', '允許檢視利潤分析'),
      -- Sites
      ('sites:read', '檢視工地', 'sites', 'read', '允許檢視工地資料'),
      ('sites:create', '新增工地', 'sites', 'create', '允許建立工地'),
      ('sites:update', '編輯工地', 'sites', 'update', '允許編輯工地資料'),
      -- Work Orders (using hyphen naming)
      ('work-orders:read', '檢視工單', 'work-orders', 'read', '允許檢視工單'),
      ('work-orders:create', '新增工單', 'work-orders', 'create', '允許建立工單'),
      ('work-orders:update', '編輯工單', 'work-orders', 'update', '允許編輯工單'),
      ('work-orders:delete', '刪除工單', 'work-orders', 'delete', '允許刪除工單'),
      -- Tenants
      ('tenants:read', '檢視租戶', 'tenants', 'read', '允許檢視租戶資料'),
      ('tenants:update', '編輯租戶', 'tenants', 'update', '允許編輯租戶資料'),
      ('tenants:admin', '租戶管理', 'tenants', 'admin', '允許租戶系統管理'),
      -- Integrations
      ('integrations:sync', '同步整合', 'integrations', 'sync', '允許執行同步操作'),
      ('integrations:manage', '管理整合', 'integrations', 'manage', '允許管理整合設定'),
      ('integrations:admin', '整合管理', 'integrations', 'admin', '允許整合系統管理')
      ON CONFLICT ("id") DO NOTHING
    `);

    // Assign new permissions to super_admin role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
      -- Super Admin gets all new permissions
      ('super_admin', 'users:read'), ('super_admin', 'users:create'), ('super_admin', 'users:update'), ('super_admin', 'users:delete'),
      ('super_admin', 'storage:read'), ('super_admin', 'storage:upload'), ('super_admin', 'storage:delete'),
      ('super_admin', 'finance:read'), ('super_admin', 'finance:create'), ('super_admin', 'finance:update'), ('super_admin', 'finance:delete'),
      ('super_admin', 'inventory:read'), ('super_admin', 'inventory:create'), ('super_admin', 'inventory:update'), ('super_admin', 'inventory:delete'),
      ('super_admin', 'quotations:read'), ('super_admin', 'quotations:create'), ('super_admin', 'quotations:update'), ('super_admin', 'quotations:submit'), ('super_admin', 'quotations:approve'),
      ('super_admin', 'clients:read'), ('super_admin', 'clients:create'), ('super_admin', 'clients:update'), ('super_admin', 'clients:delete'),
      ('super_admin', 'client-contacts:read'), ('super_admin', 'client-contacts:create'), ('super_admin', 'client-contacts:update'), ('super_admin', 'client-contacts:delete'),
      ('super_admin', 'events:read'), ('super_admin', 'events:create'), ('super_admin', 'events:update'), ('super_admin', 'events:delete'),
      ('super_admin', 'cmm:read'), ('super_admin', 'cmm:create'), ('super_admin', 'cmm:update'), ('super_admin', 'cmm:admin'),
      ('super_admin', 'change-orders:read'), ('super_admin', 'change-orders:create'), ('super_admin', 'change-orders:update'), ('super_admin', 'change-orders:submit'), ('super_admin', 'change-orders:approve'), ('super_admin', 'change-orders:reject'),
      ('super_admin', 'cost-entries:read'), ('super_admin', 'cost-entries:create'), ('super_admin', 'cost-entries:update'), ('super_admin', 'cost-entries:delete'),
      ('super_admin', 'profit-analysis:read'),
      ('super_admin', 'sites:read'), ('super_admin', 'sites:create'), ('super_admin', 'sites:update'),
      ('super_admin', 'work-orders:read'), ('super_admin', 'work-orders:create'), ('super_admin', 'work-orders:update'), ('super_admin', 'work-orders:delete'),
      ('super_admin', 'tenants:read'), ('super_admin', 'tenants:update'), ('super_admin', 'tenants:admin'),
      ('super_admin', 'integrations:sync'), ('super_admin', 'integrations:manage'), ('super_admin', 'integrations:admin')
      ON CONFLICT DO NOTHING
    `);

    // Assign permissions to admin role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
      ('admin', 'users:read'), ('admin', 'users:create'), ('admin', 'users:update'),
      ('admin', 'storage:read'), ('admin', 'storage:upload'), ('admin', 'storage:delete'),
      ('admin', 'finance:read'), ('admin', 'finance:create'), ('admin', 'finance:update'),
      ('admin', 'inventory:read'), ('admin', 'inventory:create'), ('admin', 'inventory:update'),
      ('admin', 'quotations:read'), ('admin', 'quotations:create'), ('admin', 'quotations:update'), ('admin', 'quotations:submit'), ('admin', 'quotations:approve'),
      ('admin', 'clients:read'), ('admin', 'clients:create'), ('admin', 'clients:update'),
      ('admin', 'client-contacts:read'), ('admin', 'client-contacts:create'), ('admin', 'client-contacts:update'), ('admin', 'client-contacts:delete'),
      ('admin', 'events:read'), ('admin', 'events:create'), ('admin', 'events:update'), ('admin', 'events:delete'),
      ('admin', 'cmm:read'), ('admin', 'cmm:create'), ('admin', 'cmm:update'),
      ('admin', 'change-orders:read'), ('admin', 'change-orders:create'), ('admin', 'change-orders:update'), ('admin', 'change-orders:submit'), ('admin', 'change-orders:approve'),
      ('admin', 'cost-entries:read'), ('admin', 'cost-entries:create'), ('admin', 'cost-entries:update'),
      ('admin', 'profit-analysis:read'),
      ('admin', 'sites:read'), ('admin', 'sites:create'), ('admin', 'sites:update'),
      ('admin', 'work-orders:read'), ('admin', 'work-orders:create'), ('admin', 'work-orders:update'),
      ('admin', 'tenants:read'), ('admin', 'tenants:update'),
      ('admin', 'integrations:sync'), ('admin', 'integrations:manage')
      ON CONFLICT DO NOTHING
    `);

    // Assign permissions to project_manager role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
      ('project_manager', 'storage:read'), ('project_manager', 'storage:upload'),
      ('project_manager', 'inventory:read'), ('project_manager', 'inventory:create'), ('project_manager', 'inventory:update'),
      ('project_manager', 'quotations:read'), ('project_manager', 'quotations:create'), ('project_manager', 'quotations:update'), ('project_manager', 'quotations:submit'),
      ('project_manager', 'clients:read'), ('project_manager', 'clients:create'), ('project_manager', 'clients:update'),
      ('project_manager', 'client-contacts:read'), ('project_manager', 'client-contacts:create'), ('project_manager', 'client-contacts:update'),
      ('project_manager', 'events:read'), ('project_manager', 'events:create'), ('project_manager', 'events:update'),
      ('project_manager', 'cmm:read'), ('project_manager', 'cmm:create'),
      ('project_manager', 'change-orders:read'), ('project_manager', 'change-orders:create'), ('project_manager', 'change-orders:update'), ('project_manager', 'change-orders:submit'),
      ('project_manager', 'cost-entries:read'), ('project_manager', 'cost-entries:create'), ('project_manager', 'cost-entries:update'),
      ('project_manager', 'profit-analysis:read'),
      ('project_manager', 'sites:read'), ('project_manager', 'sites:create'), ('project_manager', 'sites:update'),
      ('project_manager', 'work-orders:read'), ('project_manager', 'work-orders:create'), ('project_manager', 'work-orders:update'),
      ('project_manager', 'tenants:read'),
      ('project_manager', 'integrations:sync')
      ON CONFLICT DO NOTHING
    `);

    // Assign permissions to finance role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
      ('finance', 'finance:read'), ('finance', 'finance:create'), ('finance', 'finance:update'),
      ('finance', 'cost-entries:read'), ('finance', 'cost-entries:create'), ('finance', 'cost-entries:update'),
      ('finance', 'profit-analysis:read'),
      ('finance', 'clients:read'),
      ('finance', 'quotations:read')
      ON CONFLICT DO NOTHING
    `);

    // Assign permissions to engineer role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
      ('engineer', 'storage:read'), ('engineer', 'storage:upload'),
      ('engineer', 'inventory:read'),
      ('engineer', 'events:read'), ('engineer', 'events:create'), ('engineer', 'events:update'),
      ('engineer', 'cmm:read'),
      ('engineer', 'sites:read'),
      ('engineer', 'work-orders:read'), ('engineer', 'work-orders:update'),
      ('engineer', 'clients:read'),
      ('engineer', 'client-contacts:read')
      ON CONFLICT DO NOTHING
    `);

    // Assign permissions to viewer role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
      ('viewer', 'storage:read'),
      ('viewer', 'inventory:read'),
      ('viewer', 'clients:read'),
      ('viewer', 'events:read'),
      ('viewer', 'cmm:read'),
      ('viewer', 'cost-entries:read'),
      ('viewer', 'profit-analysis:read'),
      ('viewer', 'sites:read'),
      ('viewer', 'tenants:read')
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove role_permissions first
    const permissionIds = [
      "users:read",
      "users:create",
      "users:update",
      "users:delete",
      "storage:read",
      "storage:upload",
      "storage:delete",
      "finance:read",
      "finance:create",
      "finance:update",
      "finance:delete",
      "inventory:read",
      "inventory:create",
      "inventory:update",
      "inventory:delete",
      "quotations:read",
      "quotations:create",
      "quotations:update",
      "quotations:submit",
      "quotations:approve",
      "clients:read",
      "clients:create",
      "clients:update",
      "clients:delete",
      "client-contacts:read",
      "client-contacts:create",
      "client-contacts:update",
      "client-contacts:delete",
      "events:read",
      "events:create",
      "events:update",
      "events:delete",
      "cmm:read",
      "cmm:create",
      "cmm:update",
      "cmm:admin",
      "change-orders:read",
      "change-orders:create",
      "change-orders:update",
      "change-orders:submit",
      "change-orders:approve",
      "change-orders:reject",
      "cost-entries:read",
      "cost-entries:create",
      "cost-entries:update",
      "cost-entries:delete",
      "profit-analysis:read",
      "sites:read",
      "sites:create",
      "sites:update",
      "work-orders:read",
      "work-orders:create",
      "work-orders:update",
      "work-orders:delete",
      "tenants:read",
      "tenants:update",
      "tenants:admin",
      "integrations:sync",
      "integrations:manage",
      "integrations:admin",
    ];

    for (const permId of permissionIds) {
      await queryRunner.query(
        `DELETE FROM "role_permissions" WHERE "permission_id" = $1`,
        [permId],
      );
      await queryRunner.query(`DELETE FROM "permissions" WHERE "id" = $1`, [
        permId,
      ]);
    }
  }
}
