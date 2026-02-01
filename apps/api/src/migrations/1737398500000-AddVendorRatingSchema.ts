import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from "typeorm";

/**
 * Migration: Add vendor rating schema
 *
 * - Adds detailed rating columns to vendors table
 * - Creates vendor_ratings table for individual evaluation records
 */
export class AddVendorRatingSchema1737398500000 implements MigrationInterface {
  name = "AddVendorRatingSchema1737398500000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add new columns to vendors table
    await queryRunner.query(`
      ALTER TABLE vendors
      ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2),
      ADD COLUMN IF NOT EXISTS delivery_score DECIMAL(3,2),
      ADD COLUMN IF NOT EXISTS price_score DECIMAL(3,2),
      ADD COLUMN IF NOT EXISTS service_score DECIMAL(3,2),
      ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS on_time_deliveries INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0
    `);

    // 2. Create vendor_ratings table
    await queryRunner.createTable(
      new Table({
        name: "vendor_ratings",
        columns: [
          { name: "id", type: "varchar", length: "36", isPrimary: true },
          {
            name: "vendor_id",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "project_id",
            type: "varchar",
            length: "20",
            isNullable: true,
          },
          {
            name: "purchase_order_id",
            type: "varchar",
            length: "30",
            isNullable: true,
          },
          {
            name: "quality_score",
            type: "decimal",
            precision: 3,
            scale: 2,
            isNullable: false,
          },
          {
            name: "delivery_score",
            type: "decimal",
            precision: 3,
            scale: 2,
            isNullable: false,
          },
          {
            name: "price_score",
            type: "decimal",
            precision: 3,
            scale: 2,
            isNullable: false,
          },
          {
            name: "service_score",
            type: "decimal",
            precision: 3,
            scale: 2,
            isNullable: false,
          },
          {
            name: "overall_score",
            type: "decimal",
            precision: 3,
            scale: 2,
            isNullable: false,
          },
          { name: "comments", type: "text", isNullable: true },
          { name: "positives", type: "text", isArray: true, isNullable: true },
          { name: "negatives", type: "text", isArray: true, isNullable: true },
          { name: "expected_delivery_date", type: "date", isNullable: true },
          { name: "actual_delivery_date", type: "date", isNullable: true },
          { name: "is_on_time", type: "boolean", default: true },
          {
            name: "rated_by",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "rated_by_name",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    );

    // 3. Add indexes (with IF NOT EXISTS to prevent duplicate errors)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vendor_ratings_vendor_id" ON "vendor_ratings" ("vendor_id");
      CREATE INDEX IF NOT EXISTS "IDX_vendor_ratings_project_id" ON "vendor_ratings" ("project_id");
      CREATE INDEX IF NOT EXISTS "IDX_vendor_ratings_created_at" ON "vendor_ratings" ("created_at");
    `);

    // 4. Add foreign keys (with IF NOT EXISTS check)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_vendor_ratings_vendor' 
            AND table_name = 'vendor_ratings'
        ) THEN
          ALTER TABLE vendor_ratings
          ADD CONSTRAINT "FK_vendor_ratings_vendor"
          FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey(
      "vendor_ratings",
      "FK_vendor_ratings_vendor",
    );

    // Drop table
    await queryRunner.dropTable("vendor_ratings");

    // Remove columns from vendors
    await queryRunner.query(`
      ALTER TABLE vendors
      DROP COLUMN IF EXISTS quality_score,
      DROP COLUMN IF EXISTS delivery_score,
      DROP COLUMN IF EXISTS price_score,
      DROP COLUMN IF EXISTS service_score,
      DROP COLUMN IF EXISTS total_orders,
      DROP COLUMN IF EXISTS on_time_deliveries,
      DROP COLUMN IF EXISTS rating_count
    `);
  }
}
