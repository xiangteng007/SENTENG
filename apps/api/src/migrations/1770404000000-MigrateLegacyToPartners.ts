import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * MigrateLegacyToPartners Migration
 *
 * 將舊的 clients/vendors/customers 資料遷移到統一的 partners 表
 * 處理 ID 格式轉換：legacy varchar(20) → partner UUID
 * 使用臨時映射表維護 old_id → new_uuid 關係
 */
export class MigrateLegacyToPartners1770404000000
  implements MigrationInterface
{
  name = "MigrateLegacyToPartners1770404000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==========================================
    // Step 1: 確保 partner_id 欄位存在
    // ==========================================

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

    // ==========================================
    // Step 2: 建立臨時映射表
    // ==========================================

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS _legacy_partner_mapping (
        legacy_id VARCHAR(20) PRIMARY KEY,
        legacy_table VARCHAR(20) NOT NULL,
        partner_id UUID NOT NULL
      );
    `);

    // ==========================================
    // Step 3: 遷移 clients → partners
    // ==========================================

    // 檢查 clients 表是否存在
    const clientsTableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'clients'
      ) AS exists;
    `);

    if (clientsTableExists[0]?.exists) {
      await queryRunner.query(`
        INSERT INTO partners (id, type, name, tax_id, phone, email, address, notes, created_at, created_by, sync_status)
        SELECT 
          gen_random_uuid(),
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
        FROM clients c
        WHERE NOT EXISTS (
          SELECT 1 FROM _legacy_partner_mapping m WHERE m.legacy_id = c.id
        )
        ON CONFLICT DO NOTHING;
      `);

      // 建立映射
      await queryRunner.query(`
        INSERT INTO _legacy_partner_mapping (legacy_id, legacy_table, partner_id)
        SELECT c.id, 'clients', p.id
        FROM clients c
        INNER JOIN partners p ON p.name = c.name AND p.type = 'CLIENT'
        WHERE NOT EXISTS (
          SELECT 1 FROM _legacy_partner_mapping m WHERE m.legacy_id = c.id
        );
      `);
    }

    // ==========================================
    // Step 4: 遷移 vendors → partners
    // ==========================================

    const vendorsTableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'vendors'
      ) AS exists;
    `);

    if (vendorsTableExists[0]?.exists) {
      await queryRunner.query(`
        INSERT INTO partners (id, type, name, tax_id, category, phone, email, address, rating, notes, created_at, sync_status)
        SELECT 
          gen_random_uuid(),
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
        FROM vendors v
        WHERE NOT EXISTS (
          SELECT 1 FROM _legacy_partner_mapping m WHERE m.legacy_id = v.id
        )
        ON CONFLICT DO NOTHING;
      `);

      await queryRunner.query(`
        INSERT INTO _legacy_partner_mapping (legacy_id, legacy_table, partner_id)
        SELECT v.id, 'vendors', p.id
        FROM vendors v
        INNER JOIN partners p ON p.name = v.name AND p.type = 'VENDOR'
        WHERE NOT EXISTS (
          SELECT 1 FROM _legacy_partner_mapping m WHERE m.legacy_id = v.id
        );
      `);
    }

    // ==========================================
    // Step 5: 遷移 customers → partners
    // ==========================================

    const customersTableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'customers'
      ) AS exists;
    `);

    if (customersTableExists[0]?.exists) {
      await queryRunner.query(`
        INSERT INTO partners (id, type, name, phone, email, address, notes, created_at, sync_status)
        SELECT 
          gen_random_uuid(),
          'CLIENT',
          name,
          phone,
          email,
          address,
          notes,
          created_at,
          'PENDING'
        FROM customers cu
        WHERE NOT EXISTS (
          SELECT 1 FROM _legacy_partner_mapping m WHERE m.legacy_id = cu.id
        )
        ON CONFLICT DO NOTHING;
      `);

      await queryRunner.query(`
        INSERT INTO _legacy_partner_mapping (legacy_id, legacy_table, partner_id)
        SELECT cu.id, 'customers', p.id
        FROM customers cu
        INNER JOIN partners p ON p.name = cu.name AND p.type = 'CLIENT'
        WHERE NOT EXISTS (
          SELECT 1 FROM _legacy_partner_mapping m WHERE m.legacy_id = cu.id
        );
      `);
    }

    // ==========================================
    // Step 6: 使用映射表更新 FK
    // ==========================================

    // 更新 invoices.partner_id 從 client_id
    await queryRunner.query(`
      UPDATE invoices i
      SET partner_id = m.partner_id
      FROM _legacy_partner_mapping m
      WHERE i.client_id = m.legacy_id
        AND i.partner_id IS NULL;
    `);

    // 更新 invoices.partner_id 從 vendor_id
    await queryRunner.query(`
      UPDATE invoices i
      SET partner_id = m.partner_id
      FROM _legacy_partner_mapping m
      WHERE i.vendor_id = m.legacy_id
        AND i.partner_id IS NULL;
    `);

    // 更新 projects.partner_id 從 customer_id
    await queryRunner.query(`
      UPDATE projects p
      SET partner_id = m.partner_id
      FROM _legacy_partner_mapping m
      WHERE p.customer_id = m.legacy_id
        AND p.partner_id IS NULL;
    `);

    // ==========================================
    // Step 7: 建立索引和 FK
    // ==========================================

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_partner_id ON invoices(partner_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_partner_id ON projects(partner_id);
    `);

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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_partner;
      ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_partner;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_invoices_partner_id;
      DROP INDEX IF EXISTS idx_projects_partner_id;
    `);

    await queryRunner.query(`
      ALTER TABLE invoices DROP COLUMN IF EXISTS partner_id;
      ALTER TABLE projects DROP COLUMN IF EXISTS partner_id;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS _legacy_partner_mapping;
    `);
  }
}
