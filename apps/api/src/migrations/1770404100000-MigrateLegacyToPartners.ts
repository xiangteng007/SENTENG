import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * MigrateLegacyToPartners Migration (simplified)
 *
 * Phase 1: Add partner_id columns and indexes to invoices and projects
 * Phase 2: Data migration will be done separately via manual SQL
 */
export class MigrateLegacyToPartners1770404100000
  implements MigrationInterface
{
  name = "MigrateLegacyToPartners1770404100000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Cleanup: remove stale records from previous failed migration attempts
    await queryRunner.query(`
      DELETE FROM migrations WHERE name = 'MigrateLegacyToPartners1770404000000';
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS _legacy_partner_mapping;
    `);

    // Add partner_id column to invoices if not exists
    const invoiceColExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'partner_id'
      ) AS exists;
    `);

    if (!invoiceColExists[0]?.exists) {
      await queryRunner.query(`ALTER TABLE invoices ADD COLUMN partner_id UUID;`);
    }

    // Add partner_id column to projects if not exists
    const projectColExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'partner_id'
      ) AS exists;
    `);

    if (!projectColExists[0]?.exists) {
      await queryRunner.query(`ALTER TABLE projects ADD COLUMN partner_id UUID;`);
    }

    // Create indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_invoices_partner_id ON invoices(partner_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_projects_partner_id ON projects(partner_id);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_partner_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_partner_id;`);
    await queryRunner.query(`ALTER TABLE invoices DROP COLUMN IF EXISTS partner_id;`);
    await queryRunner.query(`ALTER TABLE projects DROP COLUMN IF EXISTS partner_id;`);
  }
}
