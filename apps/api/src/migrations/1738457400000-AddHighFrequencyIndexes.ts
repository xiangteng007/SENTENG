import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * P1 優化：增加高頻查詢欄位索引
 * 
 * 使用安全模式：每個索引包裝在 try-catch 中，
 * 遇到不存在的欄位/表時跳過而非中斷遷移
 */
export class AddHighFrequencyIndexes1738457400000 implements MigrationInterface {
  name = "AddHighFrequencyIndexes1738457400000";

  private async safeCreateIndex(
    queryRunner: QueryRunner,
    sql: string,
    indexName: string,
  ): Promise<boolean> {
    try {
      await queryRunner.query(sql);
      console.log(`✅ Created index: ${indexName}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`⚠️ Skipped index ${indexName}: ${message}`);
      return false;
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    let created = 0;
    let skipped = 0;

    // Invoices 索引
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date)`,
      'idx_invoices_invoice_date')) created++; else skipped++;
    
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status)`,
      'idx_invoices_payment_status')) created++; else skipped++;
    
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date)`,
      'idx_invoices_due_date')) created++; else skipped++;

    // Projects 索引
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_projects_status_customer ON projects(status, customer_id)`,
      'idx_projects_status_customer')) created++; else skipped++;
    
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at)`,
      'idx_projects_created_at')) created++; else skipped++;

    // Vendors 索引
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_vendors_status_type ON vendors(status, vendor_type)`,
      'idx_vendors_status_type')) created++; else skipped++;

    // Transactions 索引
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_transactions_project_date ON transactions(project_id, transaction_date)`,
      'idx_transactions_project_date')) created++; else skipped++;
    
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`,
      'idx_transactions_type')) created++; else skipped++;

    // Clients 索引
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name)`,
      'idx_clients_company_name')) created++; else skipped++;
    
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status)`,
      'idx_clients_status')) created++; else skipped++;

    // Payments 索引
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`,
      'idx_payments_status')) created++; else skipped++;
    
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date)`,
      'idx_payments_due_date')) created++; else skipped++;

    // Cost Entries 索引
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_cost_entries_project_id ON cost_entries(project_id)`,
      'idx_cost_entries_project_id')) created++; else skipped++;
    
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_cost_entries_date ON cost_entries(date)`,
      'idx_cost_entries_date')) created++; else skipped++;

    // Work Orders 索引 (Drone 模組)
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status)`,
      'idx_work_orders_status')) created++; else skipped++;
    
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled_date ON work_orders(scheduled_date)`,
      'idx_work_orders_scheduled_date')) created++; else skipped++;

    // Events 索引
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date)`,
      'idx_events_start_date')) created++; else skipped++;
    
    if (await this.safeCreateIndex(queryRunner,
      `CREATE INDEX IF NOT EXISTS idx_events_project_id ON events(project_id)`,
      'idx_events_project_id')) created++; else skipped++;

    console.log(`\n✅ Migration complete: ${created} indexes created, ${skipped} skipped`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const indexes = [
      'idx_events_project_id', 'idx_events_start_date',
      'idx_work_orders_scheduled_date', 'idx_work_orders_status',
      'idx_cost_entries_date', 'idx_cost_entries_project_id',
      'idx_payments_due_date', 'idx_payments_status',
      'idx_clients_status', 'idx_clients_company_name',
      'idx_transactions_type', 'idx_transactions_project_date',
      'idx_vendors_status_type',
      'idx_projects_created_at', 'idx_projects_status_customer',
      'idx_invoices_due_date', 'idx_invoices_payment_status', 'idx_invoices_invoice_date',
    ];

    for (const idx of indexes) {
      try {
        await queryRunner.query(`DROP INDEX IF EXISTS ${idx}`);
      } catch {
        // Ignore errors when dropping
      }
    }
    console.log("✅ High-frequency query indexes dropped");
  }
}
