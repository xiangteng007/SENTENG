import { MigrationInterface, QueryRunner } from "typeorm";

export class UnifiedPlatformSchema1737398400000 implements MigrationInterface {
  name = "UnifiedPlatformSchema1737398400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create customers table (replaces clients)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customers" (
        "id" VARCHAR(20) PRIMARY KEY,
        "type" VARCHAR(20) DEFAULT 'INDIVIDUAL',
        "name" VARCHAR(100) NOT NULL,
        "tax_id" VARCHAR(15),
        "phone" VARCHAR(30),
        "email" VARCHAR(100),
        "line_id" VARCHAR(50),
        "address" TEXT,
        "pipeline_stage" VARCHAR(30) DEFAULT 'LEAD',
        "source" VARCHAR(50),
        "budget" VARCHAR(50),
        "tags" TEXT[],
        "default_currency" VARCHAR(3) DEFAULT 'TWD',
        "credit_days" INT DEFAULT 30,
        "credit_rating" VARCHAR(1) DEFAULT 'B',
        "drive_folder" VARCHAR(500),
        "custom_fields" JSONB,
        "contact_logs" JSONB,
        "notes" TEXT,
        "status" VARCHAR(20) DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "created_by" VARCHAR(20),
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_by" VARCHAR(20),
        "deleted_at" TIMESTAMP
      )
    `);

    // 2. Create customer_contacts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_contacts" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "customer_id" VARCHAR(20) REFERENCES "customers"("id") ON DELETE CASCADE,
        "name" VARCHAR(50) NOT NULL,
        "role" VARCHAR(30) DEFAULT 'OTHER',
        "title" VARCHAR(50),
        "phone" VARCHAR(30),
        "email" VARCHAR(100),
        "line_id" VARCHAR(50),
        "is_primary" BOOLEAN DEFAULT FALSE,
        "notes" TEXT,
        "google_contact_id" VARCHAR(100),
        "sync_status" VARCHAR(20) DEFAULT 'PENDING',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create vendors table (must be created before vendor_contacts)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendors" (
        "id" VARCHAR(20) PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "short_name" VARCHAR(30),
        "vendor_type" VARCHAR(30) DEFAULT 'SUPPLIER',
        "tax_id" VARCHAR(20),
        "contact_person" VARCHAR(50),
        "phone" VARCHAR(30),
        "email" VARCHAR(100),
        "line_id" VARCHAR(50),
        "address" TEXT,
        "bank_name" VARCHAR(50),
        "bank_code" VARCHAR(10),
        "bank_account" VARCHAR(50),
        "account_holder" VARCHAR(50),
        "payment_terms" VARCHAR(30) DEFAULT 'NET30',
        "tax_type" VARCHAR(20) DEFAULT 'TAX_INCLUDED',
        "rating" DECIMAL(3,2) DEFAULT 0,
        "total_projects" INT DEFAULT 0,
        "total_amount" DECIMAL(15,2) DEFAULT 0,
        "tags" TEXT[],
        "status" VARCHAR(20) DEFAULT 'ACTIVE',
        "blacklist_reason" TEXT,
        "drive_folder" VARCHAR(500),
        "certifications" JSONB,
        "reviews" JSONB,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "created_by" VARCHAR(20),
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_by" VARCHAR(20),
        "deleted_at" TIMESTAMP
      )
    `);

    // 4. Create projects table (must be created before project_phases, project_vendors, project_tasks)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" VARCHAR(20) PRIMARY KEY,
        "customer_id" VARCHAR(20),
        "name" VARCHAR(200) NOT NULL,
        "project_type" VARCHAR(30) DEFAULT 'INTERIOR',
        "address" TEXT,
        "latitude" DECIMAL(10,7),
        "longitude" DECIMAL(10,7),
        "status" VARCHAR(30) DEFAULT 'PLANNING',
        "start_date" DATE,
        "end_date" DATE,
        "actual_start" DATE,
        "actual_end" DATE,
        "currency" VARCHAR(3) DEFAULT 'TWD',
        "contract_amount" DECIMAL(15,2) DEFAULT 0,
        "change_amount" DECIMAL(15,2) DEFAULT 0,
        "current_amount" DECIMAL(15,2) DEFAULT 0,
        "cost_budget" DECIMAL(15,2) DEFAULT 0,
        "cost_actual" DECIMAL(15,2) DEFAULT 0,
        "pm_user_id" VARCHAR(20),
        "drive_folder" VARCHAR(500),
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "created_by" VARCHAR(20),
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_by" VARCHAR(20),
        "deleted_at" TIMESTAMP
      )
    `);

    // 5. Create vendor_contacts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendor_contacts" (


        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "vendor_id" VARCHAR(20) REFERENCES "vendors"("id") ON DELETE CASCADE,
        "name" VARCHAR(50) NOT NULL,
        "title" VARCHAR(50),
        "phone" VARCHAR(30),
        "email" VARCHAR(100),
        "line_id" VARCHAR(50),
        "is_primary" BOOLEAN DEFAULT FALSE,
        "notes" TEXT,
        "google_contact_id" VARCHAR(100),
        "sync_status" VARCHAR(20) DEFAULT 'PENDING',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Create vendor_trades table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendor_trades" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "vendor_id" VARCHAR(20) REFERENCES "vendors"("id") ON DELETE CASCADE,
        "trade_code" VARCHAR(30) NOT NULL,
        "trade_name" VARCHAR(50),
        "capability_level" VARCHAR(20) DEFAULT 'PRIMARY',
        "description" TEXT
      )
    `);

    // 5. Create project_phases table (WBS)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_phases" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" VARCHAR(20) REFERENCES "projects"("id") ON DELETE CASCADE,
        "phase_code" VARCHAR(30) NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "seq" INT DEFAULT 0,
        "planned_start" DATE,
        "planned_end" DATE,
        "actual_start" DATE,
        "actual_end" DATE,
        "status" VARCHAR(20) DEFAULT 'PENDING',
        "budget_amount" DECIMAL(15,2) DEFAULT 0,
        "actual_amount" DECIMAL(15,2) DEFAULT 0,
        "notes" TEXT
      )
    `);

    // 6. Create project_vendors table (N:M relationship)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_vendors" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" VARCHAR(20) REFERENCES "projects"("id") ON DELETE CASCADE,
        "vendor_id" VARCHAR(20) REFERENCES "vendors"("id") ON DELETE CASCADE,
        "role" VARCHAR(30) DEFAULT 'SUBCONTRACTOR',
        "contract_amount" DECIMAL(15,2) DEFAULT 0,
        "paid_amount" DECIMAL(15,2) DEFAULT 0,
        "performance_rating" DECIMAL(3,2),
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Create project_tasks table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_tasks" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" VARCHAR(20) REFERENCES "projects"("id") ON DELETE CASCADE,
        "phase_id" UUID REFERENCES "project_phases"("id"),
        "title" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "assignee_id" VARCHAR(20),
        "vendor_id" VARCHAR(20),
        "due_date" DATE,
        "status" VARCHAR(20) DEFAULT 'TODO',
        "priority" VARCHAR(20) DEFAULT 'MEDIUM',
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Add new columns to vendors table
    await queryRunner.query(`
      ALTER TABLE "vendors" 
      ADD COLUMN IF NOT EXISTS "bank_code" VARCHAR(10),
      ADD COLUMN IF NOT EXISTS "account_holder" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "tax_type" VARCHAR(20) DEFAULT 'TAX_INCLUDED',
      ADD COLUMN IF NOT EXISTS "total_projects" INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "total_amount" DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "blacklist_reason" TEXT,
      ADD COLUMN IF NOT EXISTS "certifications" JSONB,
      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP
    `);

    // 9. Add new columns to projects table
    await queryRunner.query(`
      ALTER TABLE "projects"
      ADD COLUMN IF NOT EXISTS "project_type" VARCHAR(30) DEFAULT 'INTERIOR',
      ADD COLUMN IF NOT EXISTS "drive_folder" VARCHAR(500),
      ADD COLUMN IF NOT EXISTS "notes" TEXT,
      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP
    `);

    // 10. Migrate data from clients to customers (only if clients table exists)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
          INSERT INTO "customers" (
            id, type, name, tax_id, phone, email, line_id, address,
            pipeline_stage, source, budget, default_currency, credit_days,
            credit_rating, drive_folder, custom_fields, contact_logs, notes,
            status, created_at, created_by, updated_at, updated_by
          )
          SELECT 
            REPLACE(id, 'CLI-', 'CLT-'), type, name, tax_id, phone, email, line_id, address,
            CASE status WHEN 'ACTIVE' THEN 'ACTIVE' ELSE 'LEAD' END,
            source, budget, default_currency, credit_days, credit_rating,
            drive_folder, custom_fields, contact_logs, notes, status,
            created_at, created_by, updated_at, updated_by
          FROM "clients"
          ON CONFLICT (id) DO NOTHING;
        END IF;
      END $$;
    `);

    // 11. Create indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_customers_pipeline ON "customers"("pipeline_stage")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_customers_status ON "customers"("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer ON "customer_contacts"("customer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor ON "vendor_contacts"("vendor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_vendor_trades_vendor ON "vendor_trades"("vendor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_vendor_trades_code ON "vendor_trades"("trade_code")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_project_phases_project ON "project_phases"("project_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_project_vendors_project ON "project_vendors"("project_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_project_vendors_vendor ON "project_vendors"("vendor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON "project_tasks"("project_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee ON "project_tasks"("assignee_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_project_tasks_due ON "project_tasks"("due_date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "project_tasks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "project_vendors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "project_phases"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "projects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendor_trades"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendor_contacts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_contacts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers"`);
  }
}
