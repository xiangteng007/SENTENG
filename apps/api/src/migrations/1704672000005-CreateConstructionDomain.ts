import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 建立 ConstructionOps 領域表
 * Note: FK constraints are added later by migration 1769447303639
 */
export class CreateConstructionDomain1704672000005 implements MigrationInterface {
  name = 'CreateConstructionDomain1704672000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // WBS Items (Work Breakdown Structure) - Note: FK to projects added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wbs_items" (
        "id" VARCHAR(30) PRIMARY KEY,
        "project_id" VARCHAR(20) NOT NULL,
        "wbs_code" VARCHAR(30),
        "name" VARCHAR(200) NOT NULL,
        "level" INT DEFAULT 1,
        "planned_start" DATE,
        "planned_end" DATE,
        "actual_start" DATE,
        "actual_end" DATE,
        "percent_complete" DECIMAL(5,2) DEFAULT 0,
        "budget_amount" DECIMAL(15,2),
        "actual_amount" DECIMAL(15,2),
        "status" VARCHAR(20) DEFAULT 'NOT_STARTED',
        "sort_order" INT DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // WBS Closure Table for tree structure - Note: FKs added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wbs_items_closure" (
        "id_ancestor" VARCHAR(30) NOT NULL,
        "id_descendant" VARCHAR(30) NOT NULL,
        PRIMARY KEY ("id_ancestor", "id_descendant")
      )
    `);

    // Schedules - Note: FK added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "schedules" (
        "id" VARCHAR(30) PRIMARY KEY,
        "wbs_item_id" VARCHAR(30) NOT NULL,
        "planned_start" DATE NOT NULL,
        "planned_end" DATE NOT NULL,
        "planned_duration" INT,
        "predecessors" TEXT[],
        "successors" TEXT[],
        "is_milestone" BOOLEAN DEFAULT false,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Site Diaries - Note: FKs added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "site_diaries" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" VARCHAR(20) NOT NULL,
        "job_site_id" VARCHAR(20),
        "diary_date" DATE NOT NULL,
        "weather" VARCHAR(50),
        "temperature_high" DECIMAL(4,1),
        "temperature_low" DECIMAL(4,1),
        "workers_count" INT,
        "work_summary" TEXT,
        "issues" TEXT,
        "safety_notes" TEXT,
        "photos" JSONB,
        "created_by" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // QAQC Issues - Note: FKs added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "qaqc_issues" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" VARCHAR(20) NOT NULL,
        "wbs_item_id" VARCHAR(30),
        "title" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "issue_type" VARCHAR(30) DEFAULT 'OBSERVATION',
        "priority" VARCHAR(20) DEFAULT 'NORMAL',
        "status" VARCHAR(30) DEFAULT 'OPEN',
        "assigned_to" VARCHAR(20),
        "due_date" DATE,
        "photos" JSONB,
        "corrective_action" TEXT,
        "verified_by" VARCHAR(20),
        "verified_at" TIMESTAMP,
        "created_by" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Safety Inspections - Note: FK added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "safety_inspections" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" VARCHAR(20) NOT NULL,
        "inspection_date" DATE NOT NULL,
        "inspection_type" VARCHAR(50) NOT NULL,
        "inspector_id" VARCHAR(20),
        "items" JSONB,
        "overall_score" DECIMAL(5,2),
        "findings" TEXT,
        "recommendations" TEXT,
        "photos" JSONB,
        "created_by" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Safety Incidents - Note: FK added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "safety_incidents" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" VARCHAR(20) NOT NULL,
        "incident_date" DATE NOT NULL,
        "incident_time" TIME,
        "incident_type" VARCHAR(30) NOT NULL,
        "title" VARCHAR(200) NOT NULL,
        "description" TEXT NOT NULL,
        "location" VARCHAR(200),
        "persons_involved" JSONB,
        "root_cause" TEXT,
        "corrective_actions" TEXT,
        "photos" JSONB,
        "status" VARCHAR(30) DEFAULT 'REPORTED',
        "reported_by" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Subcontractors - Note: FK added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subcontractors" (
        "id" VARCHAR(20) PRIMARY KEY,
        "vendor_id" VARCHAR(20),
        "trade_type" VARCHAR(50) NOT NULL,
        "license_no" VARCHAR(50),
        "license_expiry" DATE,
        "insurance_expiry" DATE,
        "safety_rating" VARCHAR(20),
        "is_active" BOOLEAN DEFAULT true,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Sub Contracts - Note: FKs added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sub_contracts" (
        "id" VARCHAR(20) PRIMARY KEY,
        "project_id" VARCHAR(20) NOT NULL,
        "subcontractor_id" VARCHAR(20) NOT NULL,
        "contract_no" VARCHAR(50),
        "title" VARCHAR(200) NOT NULL,
        "scope_of_work" TEXT,
        "contract_amount" DECIMAL(15,2) NOT NULL,
        "change_amount" DECIMAL(15,2) DEFAULT 0,
        "current_amount" DECIMAL(15,2) DEFAULT 0,
        "start_date" DATE,
        "end_date" DATE,
        "status" VARCHAR(30) DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Sub Payments - Note: FK added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sub_payments" (
        "id" VARCHAR(20) PRIMARY KEY,
        "sub_contract_id" VARCHAR(20) NOT NULL,
        "period_no" INT DEFAULT 1,
        "application_date" DATE NOT NULL,
        "request_amount" DECIMAL(15,2) NOT NULL,
        "approved_amount" DECIMAL(15,2),
        "retention_amount" DECIMAL(15,2) DEFAULT 0,
        "net_amount" DECIMAL(15,2) DEFAULT 0,
        "status" VARCHAR(30) DEFAULT 'PENDING',
        "approved_by" VARCHAR(20),
        "approved_at" TIMESTAMP,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_wbs_items_project" ON "wbs_items"("project_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_site_diaries_project_date" ON "site_diaries"("project_id", "diary_date")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_sub_contracts_project" ON "sub_contracts"("project_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sub_contracts_project"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_site_diaries_project_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_wbs_items_project"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sub_payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sub_contracts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subcontractors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "safety_incidents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "safety_inspections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "qaqc_issues"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "site_diaries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "schedules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wbs_items_closure"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wbs_items"`);
  }
}
