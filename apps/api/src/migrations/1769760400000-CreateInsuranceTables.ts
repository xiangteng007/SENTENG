import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 2.2: Insurance Module Tables
 */
export class CreateInsuranceTables1769760400000 implements MigrationInterface {
  name = "CreateInsuranceTables1769760400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing tables that may have corrupted/mismatched schema
    // These are Phase 2.2 tables that may have been partially created
    await queryRunner.query(
      `DROP TABLE IF EXISTS "project_insurances" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "insurance_rate_references" CASCADE`,
    );

    // Create insurance_rate_references table with correct schema
    await queryRunner.query(`
      CREATE TABLE "insurance_rate_references" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "insurance_type" varchar(100) NOT NULL,
        "coverage_name" varchar(255) NOT NULL,
        "min_rate" decimal(5,4),
        "max_rate" decimal(5,4),
        "typical_rate" decimal(5,4),
        "description" text,
        "effective_date" date,
        "source" varchar(255),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    // Create project_insurances table with correct schema
    await queryRunner.query(`
      CREATE TABLE "project_insurances" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "insurance_type" varchar(100) NOT NULL,
        "policy_number" varchar(100),
        "insurer_name" varchar(255) NOT NULL,
        "insurer_contact" varchar(255),
        "insured_amount" decimal(15,2) NOT NULL,
        "deductible" decimal(15,2),
        "premium" decimal(12,2),
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "beneficiary" varchar(255),
        "status" varchar(50) DEFAULT 'active',
        "policy_document_url" varchar(500),
        "notes" text,
        "claims" jsonb DEFAULT '[]',
        "created_by" uuid,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_project_insurances_project" ON "project_insurances" ("project_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_project_insurances_type_status" ON "project_insurances" ("insurance_type", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_project_insurances_end_date" ON "project_insurances" ("end_date")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_insurance_rates_type" ON "insurance_rate_references" ("insurance_type")
    `);

    // Seed insurance rate reference data
    await queryRunner.query(`
      INSERT INTO "insurance_rate_references" 
        ("insurance_type", "coverage_name", "min_rate", "max_rate", "typical_rate", "description", "source")
      VALUES
        ('contractor_all_risk', '營造綜合保險', 0.0015, 0.0080, 0.0035, '涵蓋施工期間工程本體及第三人責任', '產險公會參考費率'),
        ('employers_liability', '雇主責任險', 0.0050, 0.0150, 0.0080, '勞工職災補償責任', '產險公會參考費率'),
        ('third_party_liability', '第三人責任險', 0.0010, 0.0050, 0.0025, '施工造成第三人人身或財物損害', '產險公會參考費率'),
        ('professional_indemnity', '專業責任險', 0.0100, 0.0300, 0.0180, '設計或監造專業疏失', '產險公會參考費率'),
        ('performance_bond', '履約保證保險', 0.0050, 0.0200, 0.0100, '保證承包商履約能力', '產險公會參考費率'),
        ('advance_payment_bond', '預付款保證', 0.0030, 0.0100, 0.0050, '保證預付款專款專用', '產險公會參考費率')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "project_insurances"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "insurance_rate_references"`);
  }
}
