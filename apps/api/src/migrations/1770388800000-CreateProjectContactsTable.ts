import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProjectContactsTable1770388800000 implements MigrationInterface {
  name = "CreateProjectContactsTable1770388800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_contacts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "project_id" varchar(20) NOT NULL,
        "contact_id" varchar(36) NOT NULL,
        "source_type" varchar(20) NOT NULL DEFAULT 'UNIFIED',
        "role_in_project" varchar(30) NOT NULL DEFAULT 'OTHER',
        "is_primary" boolean NOT NULL DEFAULT false,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" varchar(20),
        CONSTRAINT "PK_project_contacts" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_project_contacts_project_id" 
      ON "project_contacts" ("project_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_project_contacts_contact_source" 
      ON "project_contacts" ("contact_id", "source_type")
    `);

    // Unique constraint to prevent duplicate assignments
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_project_contacts_unique" 
      ON "project_contacts" ("project_id", "contact_id", "source_type")
    `);

    // Foreign key to projects
    await queryRunner.query(`
      ALTER TABLE "project_contacts" 
      ADD CONSTRAINT "FK_project_contacts_project" 
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project_contacts" DROP CONSTRAINT IF EXISTS "FK_project_contacts_project"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_project_contacts_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_project_contacts_contact_source"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_project_contacts_project_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "project_contacts"`);
  }
}
