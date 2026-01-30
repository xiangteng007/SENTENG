import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 添加 Google Drive 整合欄位到 site_photos 表
 */
export class AddDriveFieldsToSitePhotos1706960000000 implements MigrationInterface {
  name = 'AddDriveFieldsToSitePhotos1706960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加 Google Drive 相關欄位
    await queryRunner.query(`
      ALTER TABLE "site_photos"
      ADD COLUMN IF NOT EXISTS "drive_file_id" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "drive_folder_id" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "drive_url" VARCHAR(500),
      ADD COLUMN IF NOT EXISTS "original_name" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "uploaded_by" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "size" INTEGER,
      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE
    `);

    // 創建索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_site_photos_drive_file_id" 
      ON "site_photos" ("drive_file_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_site_photos_deleted_at" 
      ON "site_photos" ("deleted_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 移除索引
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_site_photos_deleted_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_site_photos_drive_file_id"`);

    // 移除欄位
    await queryRunner.query(`
      ALTER TABLE "site_photos"
      DROP COLUMN IF EXISTS "deleted_at",
      DROP COLUMN IF EXISTS "size",
      DROP COLUMN IF EXISTS "uploaded_by",
      DROP COLUMN IF EXISTS "original_name",
      DROP COLUMN IF EXISTS "drive_url",
      DROP COLUMN IF EXISTS "drive_folder_id",
      DROP COLUMN IF EXISTS "drive_file_id"
    `);
  }
}
