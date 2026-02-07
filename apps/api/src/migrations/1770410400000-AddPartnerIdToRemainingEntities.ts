import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * AddPartnerIdToRemainingEntities
 *
 * Adds partner_id (uuid, nullable) columns and indexes to:
 *  - work_orders  (drone module)
 *  - input_invoices  (invoices module - purchase side)
 *  - subcontractors  (construction module)
 *
 * The invoices and projects tables were already handled in
 * MigrateLegacyToPartners1770404100000.
 */
export class AddPartnerIdToRemainingEntities1770410400000
  implements MigrationInterface
{
  name = "AddPartnerIdToRemainingEntities1770410400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = ["work_orders", "input_invoices", "subcontractors"];

    for (const table of tables) {
      // Check if column already exists
      const colExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = '${table}' AND column_name = 'partner_id'
        ) AS exists;
      `);

      if (!colExists[0]?.exists) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ADD COLUMN "partner_id" UUID;`,
        );
      }

      // Create index (idempotent)
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "idx_${table}_partner_id" ON "${table}"("partner_id");`,
      );

      // Add FK constraint (idempotent via IF NOT EXISTS simulation)
      const fkName = `FK_${table}_partner`;
      const fkExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = '${fkName}' AND table_name = '${table}'
        ) AS exists;
      `);

      if (!fkExists[0]?.exists) {
        await queryRunner.query(`
          ALTER TABLE "${table}"
          ADD CONSTRAINT "${fkName}"
          FOREIGN KEY ("partner_id") REFERENCES "partners"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = ["work_orders", "input_invoices", "subcontractors"];

    for (const table of tables) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "FK_${table}_partner";`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "idx_${table}_partner_id";`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "partner_id";`,
      );
    }
  }
}
