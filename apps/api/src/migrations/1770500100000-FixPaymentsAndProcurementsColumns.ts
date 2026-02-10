import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Fixup migration:
 * 1. Add missing withholding_tax column to payment_applications (if CREATE TABLE IF NOT EXISTS skipped it)
 * 2. Fix procurements.awarded_vendor_id type from UUID to VARCHAR to match TypeORM entity inference
 * 3. Fix procurement_bids.vendor_id type from UUID to VARCHAR
 */
export class FixPaymentsAndProcurementsColumns1770500100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Fix payment_applications: add withholding_tax if missing ──
    const paHasWithholdingTax = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'payment_applications' AND column_name = 'withholding_tax'
    `);
    if (paHasWithholdingTax.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "payment_applications"
        ADD COLUMN "withholding_tax" DECIMAL(15,2) NOT NULL DEFAULT 0
      `);
    }

    // ── Fix procurements: change awarded_vendor_id from UUID to VARCHAR ──
    // Drop FK constraint first if exists
    await queryRunner.query(`
      ALTER TABLE "procurements"
      DROP CONSTRAINT IF EXISTS "fk_procurement_awarded_vendor"
    `);
    // Also try the auto-generated FK name
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "procurements"
        DROP CONSTRAINT IF EXISTS "FK_procurements_awarded_vendor_id";
      EXCEPTION WHEN undefined_object THEN NULL;
      END $$;
    `);

    // Check if column exists and alter type
    const hasAwardedVendorId = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'procurements' AND column_name = 'awarded_vendor_id'
    `);
    if (hasAwardedVendorId.length > 0 && hasAwardedVendorId[0].data_type === 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "procurements"
        ALTER COLUMN "awarded_vendor_id" TYPE VARCHAR(255) USING "awarded_vendor_id"::text
      `);
    }

    // ── Fix procurement_bids: change vendor_id from UUID to VARCHAR ──
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "procurement_bids"
        DROP CONSTRAINT IF EXISTS "FK_procurement_bids_vendor_id";
      EXCEPTION WHEN undefined_object THEN NULL;
      END $$;
    `);
    const hasVendorId = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'procurement_bids' AND column_name = 'vendor_id'
    `);
    if (hasVendorId.length > 0 && hasVendorId[0].data_type === 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "procurement_bids"
        ALTER COLUMN "vendor_id" TYPE VARCHAR(255) USING "vendor_id"::text
      `);
    }

    // ── Fix procurements.id type: change from UUID to VARCHAR to match TypeORM ──
    // First drop FKs that reference procurements.id
    await queryRunner.query(`
      ALTER TABLE "procurement_bids"
      DROP CONSTRAINT IF EXISTS "fk_bid_procurement"
    `);
    // Change column types
    const procIdType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'procurements' AND column_name = 'id'
    `);
    if (procIdType.length > 0 && procIdType[0].data_type === 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "procurement_bids"
        ALTER COLUMN "procurement_id" TYPE VARCHAR(255) USING "procurement_id"::text
      `);
      await queryRunner.query(`
        ALTER TABLE "procurement_bids"
        ALTER COLUMN "id" TYPE VARCHAR(255) USING "id"::text
      `);
      await queryRunner.query(`
        ALTER TABLE "procurements"
        ALTER COLUMN "id" TYPE VARCHAR(255) USING "id"::text
      `);
    }

    // Re-add FK for procurement_bids -> procurements
    await queryRunner.query(`
      ALTER TABLE "procurement_bids"
      ADD CONSTRAINT "fk_bid_procurement"
      FOREIGN KEY ("procurement_id") REFERENCES "procurements"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert is complex; just skip for safety
  }
}
