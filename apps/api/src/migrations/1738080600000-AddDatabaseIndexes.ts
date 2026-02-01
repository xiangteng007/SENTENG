import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 資料庫索引優化
 *
 * 針對常見查詢模式添加複合索引。
 * 每個 index 創建都包裹在 try-catch 中，以防目標表或欄位不存在。
 */
export class AddDatabaseIndexes1738080600000 implements MigrationInterface {
  name = "AddDatabaseIndexes1738080600000";

  // Run without transaction so individual index failures don't abort the entire migration
  transaction = false as const;

  /**
   * Helper method to safely create an index.
   * If the table or column doesn't exist, it will silently skip.
   */
  private async safeCreateIndex(
    queryRunner: QueryRunner,
    indexName: string,
    tableName: string,
    sql: string,
  ): Promise<void> {
    try {
      await queryRunner.query(sql);
    } catch (e: any) {
      // 42P01: undefined_table, 42703: undefined_column
      if (e.code === "42P01" || e.code === "42703") {
        console.log(
          `Skipping index ${indexName} on ${tableName}: table or column does not exist`,
        );
      } else {
        throw e; // Re-throw other errors
      }
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // Projects Table
    // ========================================
    await this.safeCreateIndex(
      queryRunner,
      "idx_projects_status",
      "projects",
      `CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "projects"("status");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_projects_client_id",
      "projects",
      `CREATE INDEX IF NOT EXISTS "idx_projects_client_id" ON "projects"("client_id");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_projects_status_created",
      "projects",
      `CREATE INDEX IF NOT EXISTS "idx_projects_status_created" ON "projects"("status", "created_at" DESC);`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_projects_search",
      "projects",
      `CREATE INDEX IF NOT EXISTS "idx_projects_search" ON "projects"("name", "project_number");`,
    );

    // ========================================
    // Transactions Table (Finance)
    // ========================================
    await this.safeCreateIndex(
      queryRunner,
      "idx_transactions_date",
      "transactions",
      `CREATE INDEX IF NOT EXISTS "idx_transactions_date" ON "transactions"("transaction_date" DESC);`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_transactions_project_id",
      "transactions",
      `CREATE INDEX IF NOT EXISTS "idx_transactions_project_id" ON "transactions"("project_id");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_transactions_type_date",
      "transactions",
      `CREATE INDEX IF NOT EXISTS "idx_transactions_type_date" ON "transactions"("transaction_type", "transaction_date" DESC);`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_transactions_account_id",
      "transactions",
      `CREATE INDEX IF NOT EXISTS "idx_transactions_account_id" ON "transactions"("account_id");`,
    );

    // ========================================
    // Invoices Table
    // ========================================
    await this.safeCreateIndex(
      queryRunner,
      "idx_invoices_status",
      "invoices",
      `CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "invoices"("status");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_invoices_client_id",
      "invoices",
      `CREATE INDEX IF NOT EXISTS "idx_invoices_client_id" ON "invoices"("client_id");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_invoices_issue_date",
      "invoices",
      `CREATE INDEX IF NOT EXISTS "idx_invoices_issue_date" ON "invoices"("issue_date" DESC);`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_invoices_invoice_number",
      "invoices",
      `CREATE INDEX IF NOT EXISTS "idx_invoices_invoice_number" ON "invoices"("invoice_number");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_invoices_status_date",
      "invoices",
      `CREATE INDEX IF NOT EXISTS "idx_invoices_status_date" ON "invoices"("status", "issue_date" DESC);`,
    );

    // ========================================
    // Contracts Table
    // ========================================
    await this.safeCreateIndex(
      queryRunner,
      "idx_contracts_status",
      "contracts",
      `CREATE INDEX IF NOT EXISTS "idx_contracts_status" ON "contracts"("status");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_contracts_project_id",
      "contracts",
      `CREATE INDEX IF NOT EXISTS "idx_contracts_project_id" ON "contracts"("project_id");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_contracts_client_id",
      "contracts",
      `CREATE INDEX IF NOT EXISTS "idx_contracts_client_id" ON "contracts"("client_id");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_contracts_search",
      "contracts",
      `CREATE INDEX IF NOT EXISTS "idx_contracts_search" ON "contracts"("contract_number", "name");`,
    );

    // ========================================
    // Events Table
    // ========================================
    await this.safeCreateIndex(
      queryRunner,
      "idx_events_project_id",
      "events",
      `CREATE INDEX IF NOT EXISTS "idx_events_project_id" ON "events"("project_id");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_events_start_date",
      "events",
      `CREATE INDEX IF NOT EXISTS "idx_events_start_date" ON "events"("start_date");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_events_date_range",
      "events",
      `CREATE INDEX IF NOT EXISTS "idx_events_date_range" ON "events"("start_date", "end_date");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_events_type_date",
      "events",
      `CREATE INDEX IF NOT EXISTS "idx_events_type_date" ON "events"("event_type", "start_date" DESC);`,
    );

    // ========================================
    // Quotations Table
    // ========================================
    await this.safeCreateIndex(
      queryRunner,
      "idx_quotations_status",
      "quotations",
      `CREATE INDEX IF NOT EXISTS "idx_quotations_status" ON "quotations"("status");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_quotations_client_id",
      "quotations",
      `CREATE INDEX IF NOT EXISTS "idx_quotations_client_id" ON "quotations"("client_id");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_quotations_created_at",
      "quotations",
      `CREATE INDEX IF NOT EXISTS "idx_quotations_created_at" ON "quotations"("created_at" DESC);`,
    );

    // ========================================
    // Clients Table
    // ========================================
    await this.safeCreateIndex(
      queryRunner,
      "idx_clients_name",
      "clients",
      `CREATE INDEX IF NOT EXISTS "idx_clients_name" ON "clients"("name");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_clients_type",
      "clients",
      `CREATE INDEX IF NOT EXISTS "idx_clients_type" ON "clients"("client_type");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_clients_search",
      "clients",
      `CREATE INDEX IF NOT EXISTS "idx_clients_search" ON "clients"("name", "unified_business_no");`,
    );

    // ========================================
    // Payments Table
    // ========================================
    await this.safeCreateIndex(
      queryRunner,
      "idx_payments_status",
      "payments",
      `CREATE INDEX IF NOT EXISTS "idx_payments_status" ON "payments"("status");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_payments_project_id",
      "payments",
      `CREATE INDEX IF NOT EXISTS "idx_payments_project_id" ON "payments"("project_id");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_payments_due_date",
      "payments",
      `CREATE INDEX IF NOT EXISTS "idx_payments_due_date" ON "payments"("due_date");`,
    );

    // ========================================
    // Cost Entries Table
    // ========================================
    await this.safeCreateIndex(
      queryRunner,
      "idx_cost_entries_project_id",
      "cost_entries",
      `CREATE INDEX IF NOT EXISTS "idx_cost_entries_project_id" ON "cost_entries"("project_id");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_cost_entries_category",
      "cost_entries",
      `CREATE INDEX IF NOT EXISTS "idx_cost_entries_category" ON "cost_entries"("category");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_cost_entries_date",
      "cost_entries",
      `CREATE INDEX IF NOT EXISTS "idx_cost_entries_date" ON "cost_entries"("entry_date" DESC);`,
    );

    // ========================================
    // Inventory Table
    // ========================================
    await this.safeCreateIndex(
      queryRunner,
      "idx_inventory_category",
      "inventory",
      `CREATE INDEX IF NOT EXISTS "idx_inventory_category" ON "inventory"("category");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_inventory_sku",
      "inventory",
      `CREATE INDEX IF NOT EXISTS "idx_inventory_sku" ON "inventory"("sku");`,
    );
    // Partial index - may fail if min_quantity column doesn't exist
    await this.safeCreateIndex(
      queryRunner,
      "idx_inventory_low_stock",
      "inventory",
      `CREATE INDEX IF NOT EXISTS "idx_inventory_low_stock" ON "inventory"("quantity") WHERE "quantity" < "min_quantity";`,
    );

    // ========================================
    // Change Orders Table
    // ========================================
    await this.safeCreateIndex(
      queryRunner,
      "idx_change_orders_project_id",
      "change_orders",
      `CREATE INDEX IF NOT EXISTS "idx_change_orders_project_id" ON "change_orders"("project_id");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_change_orders_status",
      "change_orders",
      `CREATE INDEX IF NOT EXISTS "idx_change_orders_status" ON "change_orders"("status");`,
    );

    // ========================================
    // Audit Log Table
    // ========================================
    await this.safeCreateIndex(
      queryRunner,
      "idx_audit_log_timestamp",
      "audit_log",
      `CREATE INDEX IF NOT EXISTS "idx_audit_log_timestamp" ON "audit_log"("timestamp" DESC);`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_audit_log_user_id",
      "audit_log",
      `CREATE INDEX IF NOT EXISTS "idx_audit_log_user_id" ON "audit_log"("user_id");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_audit_log_entity",
      "audit_log",
      `CREATE INDEX IF NOT EXISTS "idx_audit_log_entity" ON "audit_log"("entity_type", "entity_id");`,
    );

    // ========================================
    // CMM Tables
    // ========================================
    await this.safeCreateIndex(
      queryRunner,
      "idx_cmm_materials_category",
      "cmm_material_master",
      `CREATE INDEX IF NOT EXISTS "idx_cmm_materials_category" ON "cmm_material_master"("category_l2_id");`,
    );
    await this.safeCreateIndex(
      queryRunner,
      "idx_cmm_calculation_runs_created",
      "cmm_calculation_runs",
      `CREATE INDEX IF NOT EXISTS "idx_cmm_calculation_runs_created" ON "cmm_calculation_runs"("created_at" DESC);`,
    );

    console.log("✅ Database indexes created successfully");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes created in up()
    const indexes = [
      // Projects
      "idx_projects_status",
      "idx_projects_client_id",
      "idx_projects_status_created",
      "idx_projects_search",
      // Transactions
      "idx_transactions_date",
      "idx_transactions_project_id",
      "idx_transactions_type_date",
      "idx_transactions_account_id",
      // Invoices
      "idx_invoices_status",
      "idx_invoices_client_id",
      "idx_invoices_issue_date",
      "idx_invoices_invoice_number",
      "idx_invoices_status_date",
      // Contracts
      "idx_contracts_status",
      "idx_contracts_project_id",
      "idx_contracts_client_id",
      "idx_contracts_search",
      // Events
      "idx_events_project_id",
      "idx_events_start_date",
      "idx_events_date_range",
      "idx_events_type_date",
      // Quotations
      "idx_quotations_status",
      "idx_quotations_client_id",
      "idx_quotations_created_at",
      // Clients
      "idx_clients_name",
      "idx_clients_type",
      "idx_clients_search",
      // Payments
      "idx_payments_status",
      "idx_payments_project_id",
      "idx_payments_due_date",
      // Cost Entries
      "idx_cost_entries_project_id",
      "idx_cost_entries_category",
      "idx_cost_entries_date",
      // Inventory
      "idx_inventory_category",
      "idx_inventory_sku",
      "idx_inventory_low_stock",
      // Change Orders
      "idx_change_orders_project_id",
      "idx_change_orders_status",
      // Audit Log
      "idx_audit_log_timestamp",
      "idx_audit_log_user_id",
      "idx_audit_log_entity",
      // CMM
      "idx_cmm_materials_category",
      "idx_cmm_calculation_runs_created",
    ];

    for (const idx of indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${idx}"`);
    }
  }
}
