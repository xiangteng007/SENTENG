import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Add missing withholding_tax column to payment_applications table.
 * The initial CreatePaymentsAndProcurementsTables migration may have
 * omitted this column or the table pre-existed without it.
 */
export class FixPaymentsAndProcurementsColumns1770500100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add withholding_tax if not exists
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "payment_applications"
        ADD COLUMN "withholding_tax" DECIMAL(15,2) NOT NULL DEFAULT 0;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // Add any other missing columns from payment entity
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "payment_applications"
        ADD COLUMN "locked_at" TIMESTAMP;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "payment_applications"
        ADD COLUMN "locked_by" VARCHAR(20);
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "payment_applications"
        ADD COLUMN "created_by" VARCHAR(20);
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "payment_applications"
        ADD COLUMN "updated_by" VARCHAR(20);
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_applications" DROP COLUMN IF EXISTS "withholding_tax"`);
    await queryRunner.query(`ALTER TABLE "payment_applications" DROP COLUMN IF EXISTS "locked_at"`);
    await queryRunner.query(`ALTER TABLE "payment_applications" DROP COLUMN IF EXISTS "locked_by"`);
    await queryRunner.query(`ALTER TABLE "payment_applications" DROP COLUMN IF EXISTS "created_by"`);
    await queryRunner.query(`ALTER TABLE "payment_applications" DROP COLUMN IF EXISTS "updated_by"`);
  }
}
