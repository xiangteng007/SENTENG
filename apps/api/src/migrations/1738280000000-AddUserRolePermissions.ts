import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 為 'user' 角色新增基本權限
 *
 * 修復問題：user 角色缺少 projects:read、clients:read 等基本權限
 *
 * 注意：此 migration 在 E2E 環境中可能會失敗（permissions 表為空），
 * 因此使用 transaction = false 並包裹在 try-catch 中以優雅處理。
 */
export class AddUserRolePermissions1738280000000 implements MigrationInterface {
  name = "AddUserRolePermissions1738280000000";

  // Run without transaction so FK failures don't abort the entire migration
  transaction = false as const;

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // First ensure the 'user' role exists in roles table
      await queryRunner.query(`
                INSERT INTO "roles" ("id", "name", "description")
                VALUES ('user', '一般使用者', '系統基本使用者')
                ON CONFLICT ("id") DO NOTHING
            `);

      // Assign basic read permissions to 'user' role
      await queryRunner.query(`
                INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
                -- Projects (基本專案檢視)
                ('user', 'projects:read'),
                -- Clients (基本客戶檢視)
                ('user', 'clients:read'),
                ('user', 'client-contacts:read'),
                -- Vendors (基本廠商檢視)
                ('user', 'vendors:read'),
                -- Storage (檔案檢視)
                ('user', 'storage:read'),
                -- Events (行事曆)
                ('user', 'events:read'),
                -- CMM (材料估算)
                ('user', 'cmm:read'),
                -- Inventory (庫存檢視)
                ('user', 'inventory:read'),
                -- Quotations (報價檢視)
                ('user', 'quotations:read'),
                -- Cost entries (成本檢視)
                ('user', 'cost-entries:read'),
                -- Finance (財務檢視)
                ('user', 'finance:read'),
                -- Sites (工地檢視)
                ('user', 'sites:read'),
                -- Contracts (合約檢視)
                ('user', 'contracts:read'),
                -- Payments (付款檢視)
                ('user', 'payments:read'),
                -- Procurements (採購檢視)
                ('user', 'procurements:read'),
                -- Tenants (租戶基本資訊)
                ('user', 'tenants:read')
                ON CONFLICT DO NOTHING
            `);
    } catch (e: any) {
      // 23503: foreign_key_violation - permissions not seeded yet
      // 42P01: undefined_table - table doesn't exist in E2E environment
      if (e.code === "23503" || e.code === "42P01") {
        console.log(
          "Skipping AddUserRolePermissions: permissions table may be empty or not exist",
        );
      } else {
        throw e;
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const userPermissions = [
      "projects:read",
      "clients:read",
      "client-contacts:read",
      "vendors:read",
      "storage:read",
      "events:read",
      "cmm:read",
      "inventory:read",
      "quotations:read",
      "cost-entries:read",
      "finance:read",
      "sites:read",
      "contracts:read",
      "payments:read",
      "procurements:read",
      "tenants:read",
    ];

    for (const permId of userPermissions) {
      try {
        await queryRunner.query(
          `DELETE FROM "role_permissions" WHERE "role_id" = 'user' AND "permission_id" = $1`,
          [permId],
        );
      } catch {
        // Ignore errors in rollback
      }
    }
  }
}
