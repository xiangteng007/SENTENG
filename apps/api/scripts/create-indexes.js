/**
 * Standalone script to create high-frequency indexes
 * Run: node scripts/create-indexes.js
 */
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'erp_app',
    password: process.env.DB_PASSWORD || 'SentengERP2026!',
    database: process.env.DB_DATABASE || 'erp',
  });

  await client.connect();
  console.log('Connected to database');

  const indexes = [
    { name: 'idx_invoices_invoice_date', sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date)' },
    { name: 'idx_invoices_payment_status', sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status)' },
    { name: 'idx_invoices_due_date', sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date)' },
    { name: 'idx_projects_status_customer', sql: 'CREATE INDEX IF NOT EXISTS idx_projects_status_customer ON projects(status, customer_id)' },
    { name: 'idx_projects_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at)' },
    { name: 'idx_vendors_status_type', sql: 'CREATE INDEX IF NOT EXISTS idx_vendors_status_type ON vendors(status, vendor_type)' },
    { name: 'idx_transactions_project_date', sql: 'CREATE INDEX IF NOT EXISTS idx_transactions_project_date ON transactions(project_id, transaction_date)' },
    { name: 'idx_transactions_type', sql: 'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)' },
    { name: 'idx_clients_company_name', sql: 'CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name)' },
    { name: 'idx_clients_status', sql: 'CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status)' },
    { name: 'idx_payments_status', sql: 'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)' },
    { name: 'idx_payments_due_date', sql: 'CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date)' },
    { name: 'idx_cost_entries_project_id', sql: 'CREATE INDEX IF NOT EXISTS idx_cost_entries_project_id ON cost_entries(project_id)' },
    { name: 'idx_cost_entries_date', sql: 'CREATE INDEX IF NOT EXISTS idx_cost_entries_date ON cost_entries(date)' },
    { name: 'idx_work_orders_status', sql: 'CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status)' },
    { name: 'idx_work_orders_scheduled_date', sql: 'CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled_date ON work_orders(scheduled_date)' },
    { name: 'idx_events_start_date', sql: 'CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date)' },
    { name: 'idx_events_project_id', sql: 'CREATE INDEX IF NOT EXISTS idx_events_project_id ON events(project_id)' },
  ];

  let created = 0;
  let skipped = 0;

  for (const idx of indexes) {
    try {
      await client.query(idx.sql);
      console.log(`✅ Created: ${idx.name}`);
      created++;
    } catch (err) {
      console.log(`⚠️ Skipped ${idx.name}: ${err.message}`);
      skipped++;
    }
  }

  // Mark migration as executed in typeorm_migrations table
  try {
    await client.query(
      `INSERT INTO migrations (timestamp, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [1738457400000, 'AddHighFrequencyIndexes1738457400000']
    );
    console.log('\n✅ Recorded migration in migrations table');
  } catch (err) {
    console.log(`⚠️ Could not record migration: ${err.message}`);
  }

  await client.end();
  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
}

main().catch(console.error);
