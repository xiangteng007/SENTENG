import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 建立 RBAC 表並設定預設角色與權限
 */
export class CreateRbacTables1704672000006 implements MigrationInterface {
  name = "CreateRbacTables1704672000006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Permissions
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" VARCHAR(50) PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "module" VARCHAR(50),
        "action" VARCHAR(30),
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Roles
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" VARCHAR(30) PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "name_zh" VARCHAR(100),
        "description" TEXT,
        "level" INT DEFAULT 1,
        "is_system" BOOLEAN DEFAULT false,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Role Permissions (many-to-many)
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" VARCHAR(30) NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "permission_id" VARCHAR(50) NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
        PRIMARY KEY ("role_id", "permission_id")
      )
    `);

    // User Roles
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "user_id" VARCHAR(20) NOT NULL,
        "role_id" VARCHAR(30) NOT NULL REFERENCES "roles"("id"),
        "business_unit_id" VARCHAR(20) DEFAULT '*',
        "is_active" BOOLEAN DEFAULT true,
        "granted_by" VARCHAR(20),
        "granted_at" TIMESTAMP DEFAULT NOW(),
        "expires_at" TIMESTAMP,
        PRIMARY KEY ("user_id", "role_id", "business_unit_id")
      )
    `);

    // Insert default permissions
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "name", "module", "action", "description") VALUES
      -- Projects
      ('projects:create', '新增專案', 'projects', 'create', '允許建立新專案'),
      ('projects:read', '檢視專案', 'projects', 'read', '允許檢視專案資料'),
      ('projects:update', '編輯專案', 'projects', 'update', '允許編輯專案資料'),
      ('projects:delete', '刪除專案', 'projects', 'delete', '允許刪除專案'),
      -- Contracts
      ('contracts:create', '新增合約', 'contracts', 'create', '允許建立合約'),
      ('contracts:read', '檢視合約', 'contracts', 'read', '允許檢視合約'),
      ('contracts:update', '編輯合約', 'contracts', 'update', '允許編輯合約'),
      ('contracts:approve', '核准合約', 'contracts', 'approve', '允許核准合約'),
      -- Invoices
      ('invoices:create', '新增發票', 'invoices', 'create', '允許建立發票'),
      ('invoices:read', '檢視發票', 'invoices', 'read', '允許檢視發票'),
      ('invoices:approve', '核准發票', 'invoices', 'approve', '允許核准發票'),
      -- Payments
      ('payments:create', '新增請款', 'payments', 'create', '允許建立請款'),
      ('payments:read', '檢視請款', 'payments', 'read', '允許檢視請款'),
      ('payments:approve', '核准請款', 'payments', 'approve', '允許核准請款'),
      -- Work Orders (Drone)
      ('work_orders:create', '新增工單', 'work_orders', 'create', '允許建立工單'),
      ('work_orders:read', '檢視工單', 'work_orders', 'read', '允許檢視工單'),
      ('work_orders:update', '編輯工單', 'work_orders', 'update', '允許編輯工單'),
      ('work_orders:dispatch', '派工', 'work_orders', 'dispatch', '允許派工'),
      ('work_orders:complete', '完工', 'work_orders', 'complete', '允許標記完工'),
      -- BIM
      ('bim:read', '檢視 BIM', 'bim', 'read', '允許檢視 BIM 模型'),
      ('bim:upload', '上傳 BIM', 'bim', 'upload', '允許上傳 BIM 模型'),
      ('bim:issues', '管理 BIM 議題', 'bim', 'issues', '允許管理 BCF 議題'),
      -- Admin
      ('admin:users', '使用者管理', 'admin', 'users', '允許管理使用者'),
      ('admin:roles', '角色管理', 'admin', 'roles', '允許管理角色權限'),
      ('admin:tenants', '事業體管理', 'admin', 'tenants', '允許管理法人與事業部門')
    `);

    // Insert default roles
    await queryRunner.query(`
      INSERT INTO "roles" ("id", "name", "name_zh", "description", "level", "is_system") VALUES
      ('super_admin', 'Super Admin', '最高管理員', '系統最高權限，可存取所有功能', 10, true),
      ('admin', 'Admin', '管理員', '一般管理權限，可管理使用者與業務資料', 8, true),
      ('finance', 'Finance', '財務', '財務相關權限，可處理發票與請款', 6, true),
      ('project_manager', 'Project Manager', '專案經理', '專案管理權限，可管理專案與合約', 6, true),
      ('engineer', 'Engineer', '工務', '工程執行權限，可操作工單與現場作業', 4, true),
      ('operator', 'Operator', '操作員', '基本操作權限，可執行指派的工作', 3, true),
      ('viewer', 'Viewer', '檢視者', '唯讀權限，僅能檢視資料', 1, true)
    `);

    // Assign permissions to roles
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
      -- Super Admin: all permissions
      ('super_admin', 'projects:create'), ('super_admin', 'projects:read'), ('super_admin', 'projects:update'), ('super_admin', 'projects:delete'),
      ('super_admin', 'contracts:create'), ('super_admin', 'contracts:read'), ('super_admin', 'contracts:update'), ('super_admin', 'contracts:approve'),
      ('super_admin', 'invoices:create'), ('super_admin', 'invoices:read'), ('super_admin', 'invoices:approve'),
      ('super_admin', 'payments:create'), ('super_admin', 'payments:read'), ('super_admin', 'payments:approve'),
      ('super_admin', 'work_orders:create'), ('super_admin', 'work_orders:read'), ('super_admin', 'work_orders:update'), ('super_admin', 'work_orders:dispatch'), ('super_admin', 'work_orders:complete'),
      ('super_admin', 'bim:read'), ('super_admin', 'bim:upload'), ('super_admin', 'bim:issues'),
      ('super_admin', 'admin:users'), ('super_admin', 'admin:roles'), ('super_admin', 'admin:tenants'),
      -- Admin
      ('admin', 'projects:create'), ('admin', 'projects:read'), ('admin', 'projects:update'),
      ('admin', 'contracts:create'), ('admin', 'contracts:read'), ('admin', 'contracts:update'),
      ('admin', 'invoices:create'), ('admin', 'invoices:read'),
      ('admin', 'payments:create'), ('admin', 'payments:read'),
      ('admin', 'work_orders:create'), ('admin', 'work_orders:read'), ('admin', 'work_orders:update'), ('admin', 'work_orders:dispatch'),
      ('admin', 'bim:read'), ('admin', 'bim:upload'), ('admin', 'bim:issues'),
      ('admin', 'admin:users'),
      -- Finance
      ('finance', 'projects:read'), ('finance', 'contracts:read'),
      ('finance', 'invoices:create'), ('finance', 'invoices:read'), ('finance', 'invoices:approve'),
      ('finance', 'payments:create'), ('finance', 'payments:read'), ('finance', 'payments:approve'),
      -- Project Manager
      ('project_manager', 'projects:create'), ('project_manager', 'projects:read'), ('project_manager', 'projects:update'),
      ('project_manager', 'contracts:create'), ('project_manager', 'contracts:read'), ('project_manager', 'contracts:update'),
      ('project_manager', 'work_orders:create'), ('project_manager', 'work_orders:read'), ('project_manager', 'work_orders:update'), ('project_manager', 'work_orders:dispatch'),
      ('project_manager', 'bim:read'), ('project_manager', 'bim:issues'),
      -- Engineer
      ('engineer', 'projects:read'),
      ('engineer', 'work_orders:read'), ('engineer', 'work_orders:update'), ('engineer', 'work_orders:complete'),
      ('engineer', 'bim:read'),
      -- Operator
      ('operator', 'work_orders:read'), ('operator', 'work_orders:complete'),
      -- Viewer
      ('viewer', 'projects:read'), ('viewer', 'contracts:read'), ('viewer', 'invoices:read'), ('viewer', 'work_orders:read'), ('viewer', 'bim:read')
    `);

    // Indexes
    await queryRunner.query(
      `CREATE INDEX "idx_user_roles_user" ON "user_roles"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_permissions_module" ON "permissions"("module")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_permissions_module"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_roles_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
  }
}
