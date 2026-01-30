import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 建立 Sites/Geo、DMS、Audit 表
 */
export class CreatePlatformCore1704672000002 implements MigrationInterface {
  name = 'CreatePlatformCore1704672000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Job Sites - Note: FK to projects added later by migration 1769447303639
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_sites" (
        "id" VARCHAR(20) PRIMARY KEY,
        "project_id" VARCHAR(20),
        "name" VARCHAR(200) NOT NULL,
        "address" TEXT,
        "latitude" DECIMAL(10,7),
        "longitude" DECIMAL(10,7),
        "risk_level" VARCHAR(20) DEFAULT 'LOW',
        "access_info" TEXT,
        "water_source" BOOLEAN DEFAULT false,
        "power_source" BOOLEAN DEFAULT false,
        "contact_name" VARCHAR(50),
        "contact_phone" VARCHAR(30),
        "notes" TEXT,
        "is_active" BOOLEAN DEFAULT true,
        "created_by" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Documents - Note: FKs added later by migration 1769447303639
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "business_unit_id" VARCHAR(20),
        "project_id" VARCHAR(20),
        "name" VARCHAR(200) NOT NULL,
        "doc_type" VARCHAR(50) DEFAULT 'OTHER',
        "current_version_id" UUID,
        "created_by" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Document Versions
    await queryRunner.query(`
      CREATE TABLE "document_versions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "document_id" UUID REFERENCES "documents"("id") ON DELETE CASCADE,
        "version_no" INT DEFAULT 1,
        "storage_uri" TEXT NOT NULL,
        "mime_type" VARCHAR(100),
        "file_size" BIGINT,
        "checksum" VARCHAR(64),
        "uploaded_by" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Media Assets - Note: FK to projects added later by migration 1769447303639
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "media_assets" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" VARCHAR(20),
        "ref_type" VARCHAR(50),
        "ref_id" VARCHAR(50),
        "media_type" VARCHAR(30) NOT NULL,
        "storage_uri" TEXT NOT NULL,
        "thumbnail_uri" TEXT,
        "mime_type" VARCHAR(100),
        "file_size" BIGINT,
        "caption" VARCHAR(200),
        "tags" TEXT[],
        "metadata" JSONB,
        "captured_at" TIMESTAMP,
        "uploaded_by" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Audit Logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "action" VARCHAR(30) NOT NULL,
        "entity_type" VARCHAR(50) NOT NULL,
        "entity_id" VARCHAR(50) NOT NULL,
        "user_id" VARCHAR(20),
        "user_email" VARCHAR(100),
        "user_name" VARCHAR(100),
        "old_values" JSONB,
        "new_values" JSONB,
        "changed_fields" TEXT[],
        "ip_address" VARCHAR(50),
        "user_agent" TEXT,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX "idx_job_sites_project" ON "job_sites"("project_id")`);
    await queryRunner.query(
      `CREATE INDEX "idx_job_sites_location" ON "job_sites"("latitude", "longitude")`
    );
    await queryRunner.query(`CREATE INDEX "idx_documents_project" ON "documents"("project_id")`);
    await queryRunner.query(
      `CREATE INDEX "idx_media_assets_ref" ON "media_assets"("ref_type", "ref_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_user" ON "audit_logs"("user_id", "created_at")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_entity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_media_assets_ref"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_documents_project"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_job_sites_location"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_job_sites_project"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "media_assets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "document_versions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_sites"`);
  }
}
