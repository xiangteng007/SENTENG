import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Fixup migration for payments and procurements tables:
 * 1. Add missing withholding_tax column to payment_applications
 * 2. Convert all UUID columns to VARCHAR to match TypeORM entity definitions
 *
 * Order of operations is critical: drop all FKs → change types → re-add FKs
 */
export class FixPaymentsAndProcurementsColumns1770500100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ═══ STEP 1: Fix payment_applications ═══
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

    // ═══ STEP 2: Drop ALL foreign keys on procurement tables ═══
    await queryRunner.query(`
      ALTER TABLE "procurement_bids" DROP CONSTRAINT IF EXISTS "fk_bid_procurement"
    `);
    await queryRunner.query(`
      ALTER TABLE "procurement_bids" DROP CONSTRAINT IF EXISTS "fk_bid_vendor"
    `);
    await queryRunner.query(`
      ALTER TABLE "procurements" DROP CONSTRAINT IF EXISTS "fk_procurement_awarded_vendor"
    `);
    await queryRunner.query(`
      ALTER TABLE "procurements" DROP CONSTRAINT IF EXISTS "fk_procurement_project"
    `);

    // ═══ STEP 3: Change ALL UUID columns to VARCHAR ═══
    // procurements.id
    const procIdType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'procurements' AND column_name = 'id'
    `);
    if (procIdType.length > 0 && procIdType[0].data_type === 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "procurements"
        ALTER COLUMN "id" TYPE VARCHAR(255) USING "id"::text
      `);
      // Also set the default for new records
      await queryRunner.query(`
        ALTER TABLE "procurements"
        ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text
      `);
    }

    // procurements.awarded_vendor_id
    const avType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'procurements' AND column_name = 'awarded_vendor_id'
    `);
    if (avType.length > 0 && avType[0].data_type === 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "procurements"
        ALTER COLUMN "awarded_vendor_id" TYPE VARCHAR(255) USING "awarded_vendor_id"::text
      `);
    }

    // procurement_bids.id
    const bidIdType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'procurement_bids' AND column_name = 'id'
    `);
    if (bidIdType.length > 0 && bidIdType[0].data_type === 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "procurement_bids"
        ALTER COLUMN "id" TYPE VARCHAR(255) USING "id"::text
      `);
      await queryRunner.query(`
        ALTER TABLE "procurement_bids"
        ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text
      `);
    }

    // procurement_bids.procurement_id
    const bidProcType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'procurement_bids' AND column_name = 'procurement_id'
    `);
    if (bidProcType.length > 0 && bidProcType[0].data_type === 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "procurement_bids"
        ALTER COLUMN "procurement_id" TYPE VARCHAR(255) USING "procurement_id"::text
      `);
    }

    // procurement_bids.vendor_id
    const bidVendorType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'procurement_bids' AND column_name = 'vendor_id'
    `);
    if (bidVendorType.length > 0 && bidVendorType[0].data_type === 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "procurement_bids"
        ALTER COLUMN "vendor_id" TYPE VARCHAR(255) USING "vendor_id"::text
      `);
    }

    // ═══ STEP 4: Re-add foreign keys (now all columns are VARCHAR) ═══
    await queryRunner.query(`
      ALTER TABLE "procurement_bids"
      ADD CONSTRAINT "fk_bid_procurement"
      FOREIGN KEY ("procurement_id") REFERENCES "procurements"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Not reversible safely due to potential data loss from UUID → VARCHAR
  }
}
