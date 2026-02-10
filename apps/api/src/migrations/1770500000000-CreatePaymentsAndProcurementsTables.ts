import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Creates payment_applications, payment_receipts, procurements, and procurement_bids tables.
 * These tables were defined in code but never had corresponding migrations.
 */
export class CreatePaymentsAndProcurementsTables1770500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── payment_applications ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_applications" (
        "id"                  VARCHAR(20) PRIMARY KEY,
        "contract_id"         VARCHAR(20) NOT NULL,
        "project_id"          VARCHAR(20) NOT NULL,
        "period_no"           INTEGER NOT NULL DEFAULT 1,
        "application_date"    DATE NOT NULL,
        "progress_percent"    DECIMAL(5,2) NOT NULL DEFAULT 0,
        "cumulative_percent"  DECIMAL(5,2) NOT NULL DEFAULT 0,
        "request_amount"      DECIMAL(15,2) NOT NULL DEFAULT 0,
        "retention_amount"    DECIMAL(15,2) NOT NULL DEFAULT 0,
        "net_amount"          DECIMAL(15,2) NOT NULL DEFAULT 0,
        "withholding_tax"     DECIMAL(15,2) NOT NULL DEFAULT 0,
        "received_amount"     DECIMAL(15,2) NOT NULL DEFAULT 0,
        "status"              VARCHAR(30) NOT NULL DEFAULT 'PAY_DRAFT',
        "locked_at"           TIMESTAMP,
        "locked_by"           VARCHAR(20),
        "notes"               TEXT,
        "created_at"          TIMESTAMP NOT NULL DEFAULT now(),
        "created_by"          VARCHAR(20),
        "updated_at"          TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by"          VARCHAR(20),
        CONSTRAINT "fk_payment_contract" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id"),
        CONSTRAINT "fk_payment_project"  FOREIGN KEY ("project_id")  REFERENCES "projects"("id")
      );
    `);

    // ── payment_receipts ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_receipts" (
        "id"                VARCHAR(30) PRIMARY KEY,
        "application_id"    VARCHAR(20) NOT NULL,
        "receipt_date"      DATE NOT NULL,
        "amount"            DECIMAL(15,2) NOT NULL,
        "payment_method"    VARCHAR(30) NOT NULL DEFAULT 'BANK_TRANSFER',
        "reference_no"      VARCHAR(50),
        "notes"             TEXT,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_receipt_application" FOREIGN KEY ("application_id") REFERENCES "payment_applications"("id")
      );
    `);

    // ── procurements ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "procurements" (
        "id"                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "project_id"          VARCHAR(20) NOT NULL,
        "title"               VARCHAR(200) NOT NULL,
        "description"         TEXT,
        "type"                VARCHAR(30) NOT NULL DEFAULT 'MATERIAL',
        "status"              VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        "budget_amount"       DECIMAL(15,2) NOT NULL DEFAULT 0,
        "deadline"            DATE,
        "rfq_deadline"        DATE,
        "specifications"      TEXT[],
        "attachments"         JSONB,
        "awarded_vendor_id"   UUID,
        "awarded_amount"      DECIMAL(15,2),
        "award_reason"        TEXT,
        "created_at"          TIMESTAMP NOT NULL DEFAULT now(),
        "created_by"          VARCHAR(20),
        "updated_at"          TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_procurement_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id")
      );
    `);

    // ── procurement_bids ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "procurement_bids" (
        "id"                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "procurement_id"      UUID NOT NULL,
        "vendor_id"           UUID NOT NULL,
        "bid_amount"          DECIMAL(15,2) NOT NULL,
        "lead_time_days"      INTEGER,
        "validity_days"       INTEGER NOT NULL DEFAULT 30,
        "notes"               TEXT,
        "attachments"         JSONB,
        "is_selected"         BOOLEAN NOT NULL DEFAULT false,
        "evaluation_score"    DECIMAL(5,2),
        "evaluation_notes"    TEXT,
        "submitted_at"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_bid_procurement" FOREIGN KEY ("procurement_id") REFERENCES "procurements"("id") ON DELETE CASCADE
      );
    `);

    // ── Indexes ──
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_procurements_project_id" ON "procurements" ("project_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_procurements_status" ON "procurements" ("status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_procurement_bids_procurement_id" ON "procurement_bids" ("procurement_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_procurement_bids_vendor_id" ON "procurement_bids" ("vendor_id");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "procurement_bids" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "procurements" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_receipts" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_applications" CASCADE;`);
  }
}
