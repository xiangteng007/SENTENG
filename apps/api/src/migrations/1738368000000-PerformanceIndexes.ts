import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 效能優化索引
 *
 * 此遷移新增高頻查詢欄位的索引：
 * - invoices: 發票日期、付款狀態
 * - projects: 狀態+客戶ID 複合索引
 * - vendors: 狀態+類型 複合索引
 * - transactions: 專案ID+日期 複合索引
 */
export class PerformanceIndexes1738368000000 implements MigrationInterface {
  name = "PerformanceIndexes1738368000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Invoices indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date 
      ON invoices(invoice_date);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_payment_status 
      ON invoices(payment_status);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_status_date 
      ON invoices(status, invoice_date);
    `);

    // Projects composite index
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_status_customer 
      ON projects(status, customer_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_status_created 
      ON projects(status, created_at);
    `);

    // Vendors composite index
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vendors_status_type 
      ON vendors(status, vendor_type);
    `);

    // Transactions composite index
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_project_date 
      ON transactions(project_id, transaction_date);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_account_date 
      ON transactions(account_id, transaction_date);
    `);

    // Work Orders indexes for drone module
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_work_orders_status_date 
      ON work_orders(status, scheduled_date);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_work_orders_project_client 
      ON work_orders(project_id, client_id);
    `);

    // Site Logs indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_site_logs_project_date 
      ON site_logs(project_id, log_date);
    `);

    // Audit Logs indexes for compliance queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp 
      ON audit_logs(user_id, "timestamp");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_action 
      ON audit_logs(entity_type, action);
    `);

    console.log("Performance indexes created successfully");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Invoices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_invoice_date;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_invoices_payment_status;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_status_date;`);

    // Projects
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_projects_status_customer;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_projects_status_created;`,
    );

    // Vendors
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vendors_status_type;`);

    // Transactions
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_transactions_project_date;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_transactions_account_date;`,
    );

    // Work Orders
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_work_orders_status_date;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_work_orders_project_client;`,
    );

    // Site Logs
    await queryRunner.query(`DROP INDEX IF EXISTS idx_site_logs_project_date;`);

    // Audit Logs
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_audit_logs_user_timestamp;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_audit_logs_entity_action;`,
    );

    console.log("Performance indexes dropped");
  }
}
