import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Migrate clients data to customers table
 *
 * - Copies all clients data into customers
 * - Maps client type to customer type
 * - Preserves all relationships
 */
export class MigrateClientsToCustomers1769760100000 implements MigrationInterface {
  name = "MigrateClientsToCustomers1769760100000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if clients table exists
    const hasClientsTable = await queryRunner.hasTable("clients");
    if (!hasClientsTable) {
      return; // No clients table to migrate
    }

    // Migrate clients data to customers table
    await queryRunner.query(`
      INSERT INTO customers (
        id, type, name, tax_id, contact_name, phone, email, line_id, address,
        pipeline_stage, source, budget, default_currency, credit_days, credit_rating,
        drive_folder, custom_fields, contact_logs, notes, status,
        created_at, created_by, updated_at, updated_by
      )
      SELECT
        id,
        CASE
          WHEN type = 'COMPANY' THEN 'COMPANY'
          WHEN type = 'INDIVIDUAL' THEN 'INDIVIDUAL'
          ELSE 'COMPANY'
        END as type,
        name,
        tax_id,
        contact_name,
        phone,
        email,
        line_id,
        address,
        'LEAD' as pipeline_stage,
        source,
        budget,
        default_currency,
        credit_days,
        credit_rating,
        drive_folder,
        custom_fields,
        contact_logs,
        notes,
        status,
        created_at,
        created_by,
        updated_at,
        updated_by
      FROM clients
      WHERE id NOT IN (SELECT id FROM customers)
      ON CONFLICT (id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration cannot be safely reverted as it's a data merge
    // Manual intervention required if rollback is needed
  }
}
