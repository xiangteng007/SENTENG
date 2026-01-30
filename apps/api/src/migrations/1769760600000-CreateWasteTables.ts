import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 2.4: Waste Management Module Tables
 */
export class CreateWasteTables1769760600000 implements MigrationInterface {
  name = 'CreateWasteTables1769760600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Waste records table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "waste_records" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "waste_type" varchar(100) NOT NULL,
        "waste_code" varchar(10) NOT NULL,
        "waste_date" date NOT NULL,
        "quantity" decimal(10,2) NOT NULL,
        "unit" varchar(20) DEFAULT 'ton',
        "status" varchar(50) DEFAULT 'generated',
        "disposer_name" varchar(255),
        "disposer_license_no" varchar(20),
        "disposal_facility" varchar(255),
        "transporter_name" varchar(255),
        "vehicle_plate" varchar(20),
        "transport_date" timestamp with time zone,
        "disposal_method" varchar(100),
        "disposal_date" timestamp with time zone,
        "manifest_number" varchar(50),
        "manifest_submitted" boolean DEFAULT false,
        "manifest_submitted_at" timestamp with time zone,
        "is_recyclable" boolean DEFAULT false,
        "recycled_quantity" decimal(10,2),
        "recycler_name" varchar(255),
        "disposal_cost" decimal(12,2),
        "transport_cost" decimal(12,2),
        "generation_location" varchar(255),
        "latitude" decimal(10,7),
        "longitude" decimal(10,7),
        "documents" jsonb,
        "notes" text,
        "created_by" uuid,
        "approved_by" uuid,
        "approved_at" timestamp with time zone,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    // Waste monthly reports table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "waste_monthly_reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "year" int NOT NULL,
        "month" int NOT NULL,
        "summary" jsonb NOT NULL,
        "total_disposal_cost" decimal(12,2) NOT NULL,
        "total_transport_cost" decimal(12,2) NOT NULL,
        "overall_recycle_rate" decimal(5,2) NOT NULL,
        "status" varchar(50) DEFAULT 'draft',
        "submitted_at" timestamp with time zone,
        "epa_report_number" varchar(100),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        UNIQUE ("project_id", "year", "month")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_waste_records_project_date" 
      ON "waste_records" ("project_id", "waste_date")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_waste_records_type_status" 
      ON "waste_records" ("waste_type", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_waste_records_manifest" 
      ON "waste_records" ("manifest_number") WHERE "manifest_number" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_waste_monthly_project_period" 
      ON "waste_monthly_reports" ("project_id", "year", "month")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "waste_monthly_reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "waste_records"`);
  }
}
