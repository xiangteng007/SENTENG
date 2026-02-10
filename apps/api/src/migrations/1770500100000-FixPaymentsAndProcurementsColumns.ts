import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Fixup migration for payments and procurements tables.
 *
 * Problem: The initial migration used UUID types but TypeORM entity
 * definitions use PrimaryGeneratedColumn("uuid") which generates
 * VARCHAR-based UUIDs in TypeORM's default behavior.
 *
 * This migration:
 * 1. Adds missing withholding_tax column to payment_applications
 * 2. Converts all UUID-typed columns to VARCHAR(255)
 *
 * Uses unconditional CAST to handle partial state from prior failed runs.
 */
export class FixPaymentsAndProcurementsColumns1770500100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ═══ STEP 1: Fix payment_applications ═══
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "payment_applications"
        ADD COLUMN "withholding_tax" DECIMAL(15,2) NOT NULL DEFAULT 0;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // ═══ STEP 2: Drop ALL foreign keys ═══
    await queryRunner.query(`ALTER TABLE "procurement_bids" DROP CONSTRAINT IF EXISTS "fk_bid_procurement"`);
    await queryRunner.query(`ALTER TABLE "procurement_bids" DROP CONSTRAINT IF EXISTS "fk_bid_vendor"`);
    await queryRunner.query(`ALTER TABLE "procurements" DROP CONSTRAINT IF EXISTS "fk_procurement_awarded_vendor"`);
    await queryRunner.query(`ALTER TABLE "procurements" DROP CONSTRAINT IF EXISTS "fk_procurement_project"`);

    // ═══ STEP 3: Convert ALL columns to VARCHAR using CAST (idempotent) ═══
    // These are safe to run even if the column is already VARCHAR
    await queryRunner.query(`ALTER TABLE "procurements" ALTER COLUMN "id" TYPE VARCHAR(255) USING "id"::text`);
    await queryRunner.query(`ALTER TABLE "procurements" ALTER COLUMN "awarded_vendor_id" TYPE VARCHAR(255) USING "awarded_vendor_id"::text`);
    await queryRunner.query(`ALTER TABLE "procurement_bids" ALTER COLUMN "id" TYPE VARCHAR(255) USING "id"::text`);
    await queryRunner.query(`ALTER TABLE "procurement_bids" ALTER COLUMN "procurement_id" TYPE VARCHAR(255) USING "procurement_id"::text`);
    await queryRunner.query(`ALTER TABLE "procurement_bids" ALTER COLUMN "vendor_id" TYPE VARCHAR(255) USING "vendor_id"::text`);

    // ═══ STEP 4: Re-add FK (now both columns are VARCHAR) ═══
    await queryRunner.query(`
      ALTER TABLE "procurement_bids"
      ADD CONSTRAINT "fk_bid_procurement"
      FOREIGN KEY ("procurement_id") REFERENCES "procurements"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Not safely reversible
  }
}
