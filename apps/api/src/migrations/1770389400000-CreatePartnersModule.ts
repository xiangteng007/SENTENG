import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePartnersModule1770389400000 implements MigrationInterface {
  name = "CreatePartnersModule1770389400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create partners table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "partners" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" varchar(20) NOT NULL DEFAULT 'CLIENT',
        "name" varchar(200) NOT NULL,
        "tax_id" varchar(20),
        "category" varchar(50),
        "phone" varchar(30),
        "email" varchar(100),
        "address" text,
        "line_id" varchar(50),
        "rating" int NOT NULL DEFAULT 0,
        "notes" text,
        "google_contact_id" varchar(100),
        "sync_status" varchar(20) NOT NULL DEFAULT 'PENDING',
        "last_synced_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "created_by" varchar(20),
        CONSTRAINT "PK_partners" PRIMARY KEY ("id")
      )
    `);

    // 2. Create partner_contacts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "partner_contacts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "partner_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "title" varchar(50),
        "phone" varchar(30),
        "mobile" varchar(30),
        "email" varchar(100),
        "line_id" varchar(50),
        "is_primary" boolean NOT NULL DEFAULT false,
        "notes" text,
        "google_contact_id" varchar(100),
        "sync_status" varchar(20) NOT NULL DEFAULT 'PENDING',
        "last_synced_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" varchar(20),
        CONSTRAINT "PK_partner_contacts" PRIMARY KEY ("id")
      )
    `);

    // 3. Create indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_partners_type" ON "partners" ("type")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_partners_name" ON "partners" ("name")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_partners_sync_status" ON "partners" ("sync_status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_partner_contacts_partner_id" ON "partner_contacts" ("partner_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_partner_contacts_is_primary" ON "partner_contacts" ("is_primary")`);

    // 4. Create foreign key
    await queryRunner.query(`
      ALTER TABLE "partner_contacts"
      ADD CONSTRAINT "FK_partner_contacts_partner"
      FOREIGN KEY ("partner_id") REFERENCES "partners"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // 5. Migrate existing data from vendors table (generate new UUIDs)
    // First, create a temp mapping table to preserve vendor_id -> partner_id relationship
    await queryRunner.query(`
      CREATE TEMP TABLE vendor_partner_map AS
      SELECT id as vendor_id, uuid_generate_v4() as partner_id
      FROM vendors
      WHERE deleted_at IS NULL
    `);

    // Insert vendors with new UUIDs
    await queryRunner.query(`
      INSERT INTO "partners" ("id", "type", "name", "tax_id", "category", "phone", "email", "address", "line_id", "rating", "notes", "created_at", "updated_at", "created_by")
      SELECT 
        m.partner_id,
        'VENDOR',
        v.name,
        v.tax_id,
        v.category,
        v.phone,
        v.email,
        v.address,
        v.line_id,
        COALESCE(v.rating, 0),
        v.notes,
        v.created_at,
        v.updated_at,
        v.created_by
      FROM vendors v
      JOIN vendor_partner_map m ON v.id = m.vendor_id
      ON CONFLICT DO NOTHING
    `);

    // 6. Migrate existing vendor contacts (with new partner_id from mapping)
    await queryRunner.query(`
      INSERT INTO "partner_contacts" ("id", "partner_id", "name", "title", "phone", "mobile", "email", "line_id", "is_primary", "notes", "google_contact_id", "sync_status", "created_at", "updated_at", "created_by")
      SELECT 
        uuid_generate_v4(),
        m.partner_id,
        vc.full_name,
        vc.title,
        vc.phone,
        vc.mobile,
        vc.email,
        vc.line_id,
        vc.is_primary,
        vc.notes,
        vc.google_resource_name,
        COALESCE(vc.sync_status, 'PENDING'),
        vc.created_at,
        vc.updated_at,
        vc.created_by
      FROM vendor_contacts vc
      JOIN vendor_partner_map m ON vc.vendor_id = m.vendor_id
      ON CONFLICT DO NOTHING
    `);

    // Clean up temp table
    await queryRunner.query(`DROP TABLE IF EXISTS vendor_partner_map`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "partner_contacts" DROP CONSTRAINT IF EXISTS "FK_partner_contacts_partner"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partner_contacts_is_primary"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partner_contacts_partner_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partners_sync_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partners_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partners_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_contacts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "partners"`);
  }
}
