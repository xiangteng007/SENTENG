import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * MigrateLegacyToPartners Migration
 *
 * 將舊的 clients/vendors/customers 資料遷移到統一的 partners 表
 * 並添加 partner_id 欄位到 invoices 和 projects 表
 */
export class MigrateLegacyToPartners1770404000000 implements MigrationInterface {
  name = "MigrateLegacyToPartners1770404000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 添加 partner_id 欄位到 invoices（如果不存在）
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'invoices' AND column_name = 'partner_id'
        ) THEN
          ALTER TABLE invoices ADD COLUMN partner_id UUID;
        END IF;
      END $$;
    `);

    // 2. 添加 partner_id 欄位到 projects（如果不存在）
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'projects' AND column_name = 'partner_id'
        ) THEN
          ALTER TABLE projects ADD COLUMN partner_id UUID;
        END IF;
      END $$;
    `);

    // 3. 從 clients 遷移資料到 partners
    await queryRunner.query(`
      INSERT INTO partners (id, type, name, tax_id, phone, email, address, notes, created_at, created_by, sync_status)
      SELECT 
        id::uuid, 
        'CLIENT', 
        name, 
        tax_id, 
        phone, 
        email, 
        address, 
        notes, 
        created_at, 
        created_by,
        'PENDING'
      FROM clients 
      WHERE id IS NOT NULL
      ON CONFLICT (id) DO NOTHING;
    `);

    // 4. 從 vendors 遷移資料到 partners
    await queryRunner.query(`
      INSERT INTO partners (id, type, name, tax_id, category, phone, email, address, rating, notes, created_at, sync_status)
      SELECT 
        id::uuid, 
        'VENDOR', 
        name, 
        tax_id, 
        category, 
        phone, 
        email, 
        address, 
        COALESCE(rating, 0), 
        notes, 
        created_at,
        'PENDING'
      FROM vendors 
      WHERE id IS NOT NULL
      ON CONFLICT (id) DO NOTHING;
    `);

    // 5. 從 customers 遷移資料到 partners（如果有 UUID 格式的 id）
    await queryRunner.query(`
      INSERT INTO partners (id, type, name, phone, email, address, notes, created_at, sync_status)
      SELECT 
        CASE 
          WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
          THEN id::uuid 
          ELSE gen_random_uuid() 
        END,
        'CLIENT', 
        name, 
        phone, 
        email, 
        address, 
        notes, 
        created_at,
        'PENDING'
      FROM customers 
      WHERE name IS NOT NULL
      ON CONFLICT (id) DO NOTHING;
    `);

    // 6. 更新 invoices.partner_id 從 client_id
    await queryRunner.query(`
      UPDATE invoices 
      SET partner_id = client_id::uuid 
      WHERE client_id IS NOT NULL 
        AND partner_id IS NULL
        AND EXISTS (SELECT 1 FROM partners WHERE id = client_id::uuid);
    `);

    // 7. 更新 invoices.partner_id 從 vendor_id（如果還沒有 partner_id）
    await queryRunner.query(`
      UPDATE invoices 
      SET partner_id = vendor_id::uuid 
      WHERE vendor_id IS NOT NULL 
        AND partner_id IS NULL
        AND EXISTS (SELECT 1 FROM partners WHERE id = vendor_id::uuid);
    `);

    // 8. 更新 projects.partner_id 從 customer_id
    await queryRunner.query(`
      UPDATE projects 
      SET partner_id = customer_id::uuid 
      WHERE customer_id IS NOT NULL 
        AND partner_id IS NULL
        AND EXISTS (SELECT 1 FROM partners WHERE id = customer_id::uuid);
    `);

    // 9. 添加外鍵約束
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_invoices_partner'
        ) THEN
          ALTER TABLE invoices 
          ADD CONSTRAINT fk_invoices_partner 
          FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_projects_partner'
        ) THEN
          ALTER TABLE projects 
          ADD CONSTRAINT fk_projects_partner 
          FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // 10. 創建索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_partner_id ON invoices(partner_id);
      CREATE INDEX IF NOT EXISTS idx_projects_partner_id ON projects(partner_id);
    `);

    // Log migration stats
    await queryRunner.query(`
      DO $$
      DECLARE
        partner_count INTEGER;
        invoice_updated INTEGER;
        project_updated INTEGER;
      BEGIN
        SELECT COUNT(*) INTO partner_count FROM partners;
        SELECT COUNT(*) INTO invoice_updated FROM invoices WHERE partner_id IS NOT NULL;
        SELECT COUNT(*) INTO project_updated FROM projects WHERE partner_id IS NOT NULL;
        RAISE NOTICE 'Migration complete: % partners, % invoices updated, % projects updated',
          partner_count, invoice_updated, project_updated;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 移除外鍵約束
    await queryRunner.query(`
      ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_partner;
      ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_partner;
    `);

    // 移除索引
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_invoices_partner_id;
      DROP INDEX IF EXISTS idx_projects_partner_id;
    `);

    // 移除欄位
    await queryRunner.query(`
      ALTER TABLE invoices DROP COLUMN IF EXISTS partner_id;
      ALTER TABLE projects DROP COLUMN IF EXISTS partner_id;
    `);

    // 注意：不刪除 partners 表中的資料，避免資料遺失
  }
}
