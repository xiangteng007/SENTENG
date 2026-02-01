import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * P1 優化：增加高頻查詢欄位索引
 * 
 * 索引說明：
 * - invoices: invoice_date, payment_status 常用於篩選和排序
 * - projects: status + customer_id 複合索引用於客戶專案查詢
 * - vendors: status + vendor_type 複合索引用於供應商分類查詢
 * - transactions: project_id + transaction_date 複合索引用於專案財務報表
 */
export class AddHighFrequencyIndexes1738457400000 implements MigrationInterface {
  name = "AddHighFrequencyIndexes1738457400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Invoices 索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date 
      ON invoices(invoice_date)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_payment_status 
      ON invoices(payment_status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_due_date 
      ON invoices(due_date)
    `);

    // Projects 複合索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_status_customer 
      ON projects(status, customer_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_created_at 
      ON projects(created_at)
    `);

    // Vendors 複合索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vendors_status_type 
      ON vendors(status, vendor_type)
    `);

    // Transactions 複合索引 (用於專案財務報表)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_project_date 
      ON transactions(project_id, transaction_date)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_type 
      ON transactions(type)
    `);

    // Clients 索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_company_name 
      ON clients(company_name)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_status 
      ON clients(status)
    `);

    // Payments 索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_status 
      ON payments(status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_due_date 
      ON payments(due_date)
    `);

    // Cost Entries 索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_cost_entries_project_id 
      ON cost_entries(project_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_cost_entries_date 
      ON cost_entries(date)
    `);

    // Work Orders 索引 (Drone 模組)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_work_orders_status 
      ON work_orders(status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled_date 
      ON work_orders(scheduled_date)
    `);

    // Events 索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_events_start_date 
      ON events(start_date)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_events_project_id 
      ON events(project_id)
    `);

    console.log("✅ High-frequency query indexes created successfully");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes in reverse order
    await queryRunner.query(`DROP INDEX IF EXISTS idx_events_project_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_events_start_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_work_orders_scheduled_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_work_orders_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_cost_entries_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_cost_entries_project_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_due_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_clients_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_clients_company_name`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_transactions_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_transactions_project_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vendors_status_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_status_customer`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_due_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_payment_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_invoice_date`);

    console.log("✅ High-frequency query indexes dropped successfully");
  }
}
