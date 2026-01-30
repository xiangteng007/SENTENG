import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 建立 BIM 領域表
 * Note: FK constraints are added later by migration 1769447303639
 */
export class CreateBimDomain1704672000003 implements MigrationInterface {
  name = 'CreateBimDomain1704672000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // BIM Models - Note: FK to projects added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bim_models" (
        "id" VARCHAR(20) PRIMARY KEY,
        "project_id" VARCHAR(20) NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "discipline" VARCHAR(30),
        "current_version_id" VARCHAR(30),
        "status" VARCHAR(20) DEFAULT 'ACTIVE',
        "description" TEXT,
        "created_by" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // BIM Model Versions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bim_model_versions" (
        "id" VARCHAR(30) PRIMARY KEY,
        "model_id" VARCHAR(20) NOT NULL,
        "version_no" INT DEFAULT 1,
        "storage_uri" TEXT,
        "file_format" VARCHAR(20),
        "file_size" BIGINT,
        "element_count" INT,
        "uploaded_by" VARCHAR(20),
        "upload_notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // BIM Elements
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bim_elements" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "model_version_id" VARCHAR(30) NOT NULL,
        "element_guid" VARCHAR(50) NOT NULL,
        "ifc_type" VARCHAR(50),
        "name" VARCHAR(200),
        "level" VARCHAR(50),
        "category" VARCHAR(50),
        "properties" JSONB,
        "geometry_hash" VARCHAR(64),
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // BIM Quantities
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bim_quantities" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "element_id" UUID NOT NULL,
        "quantity_type" VARCHAR(50) NOT NULL,
        "value" DECIMAL(15,4) NOT NULL,
        "unit" VARCHAR(20) NOT NULL,
        "formula" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // BCF Issues - Note: FKs to projects, users, change_orders added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bcf_issues" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" VARCHAR(20) NOT NULL,
        "model_id" VARCHAR(20),
        "element_guid" VARCHAR(50),
        "title" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "issue_type" VARCHAR(30) DEFAULT 'INFO',
        "priority" VARCHAR(20) DEFAULT 'NORMAL',
        "status" VARCHAR(30) DEFAULT 'OPEN',
        "assigned_to" VARCHAR(20),
        "due_date" DATE,
        "change_order_id" VARCHAR(20),
        "viewpoint" JSONB,
        "screenshots" TEXT[],
        "created_by" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        "resolved_at" TIMESTAMP,
        "resolved_by" VARCHAR(20)
      )
    `);

    // Issue Comments
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "issue_comments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "issue_id" UUID NOT NULL,
        "content" TEXT NOT NULL,
        "created_by" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_bim_models_project" ON "bim_models"("project_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_bim_elements_guid" ON "bim_elements"("element_guid")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_bcf_issues_project_status" ON "bcf_issues"("project_id", "status")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_bcf_issues_element" ON "bcf_issues"("element_guid")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bcf_issues_element"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bcf_issues_project_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bim_elements_guid"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bim_models_project"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "issue_comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bcf_issues"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bim_quantities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bim_elements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bim_model_versions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bim_models"`);
  }
}
