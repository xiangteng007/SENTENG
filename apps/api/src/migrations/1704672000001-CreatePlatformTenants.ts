import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 初始化多事業體架構表
 * - legal_entities: 法人實體
 * - business_units: 事業部門
 * - cost_centers: 成本中心
 */
export class CreatePlatformTenants1704672000001 implements MigrationInterface {
  name = 'CreatePlatformTenants1704672000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Legal Entities
    await queryRunner.query(`
      CREATE TABLE "legal_entities" (
        "id" VARCHAR(20) PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "short_name" VARCHAR(30),
        "tax_id" VARCHAR(20),
        "address" TEXT,
        "phone" VARCHAR(30),
        "email" VARCHAR(100),
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Business Units
    await queryRunner.query(`
      CREATE TABLE "business_units" (
        "id" VARCHAR(20) PRIMARY KEY,
        "legal_entity_id" VARCHAR(20) REFERENCES "legal_entities"("id"),
        "name" VARCHAR(100) NOT NULL,
        "code" VARCHAR(20) UNIQUE,
        "type" VARCHAR(30) DEFAULT 'ERP_CORE',
        "description" TEXT,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Cost Centers
    await queryRunner.query(`
      CREATE TABLE "cost_centers" (
        "id" VARCHAR(20) PRIMARY KEY,
        "business_unit_id" VARCHAR(20) REFERENCES "business_units"("id"),
        "name" VARCHAR(100) NOT NULL,
        "code" VARCHAR(20) UNIQUE,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add business_unit_id to existing ERP tables (only if tables exist)
    // These tables are created in later migrations, so we need to check existence first
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
          ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "business_unit_id" VARCHAR(20);
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cost_entries') THEN
          ALTER TABLE "cost_entries" ADD COLUMN IF NOT EXISTS "business_unit_id" VARCHAR(20);
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
          ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "business_unit_id" VARCHAR(20);
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory') THEN
          ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "business_unit_id" VARCHAR(20);
        END IF;
      END $$;
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "idx_business_units_legal_entity" ON "business_units"("legal_entity_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_cost_centers_business_unit" ON "cost_centers"("business_unit_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_cost_centers_business_unit"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_business_units_legal_entity"`);
    await queryRunner.query(`ALTER TABLE "inventory" DROP COLUMN IF EXISTS "business_unit_id"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN IF EXISTS "business_unit_id"`);
    await queryRunner.query(`ALTER TABLE "cost_entries" DROP COLUMN IF EXISTS "business_unit_id"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "business_unit_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cost_centers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "business_units"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "legal_entities"`);
  }
}
