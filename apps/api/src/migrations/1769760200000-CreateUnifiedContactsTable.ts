import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUnifiedContactsTable1769760200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create unified contacts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_type VARCHAR(20) NOT NULL,
        owner_id VARCHAR(36) NOT NULL,
        name VARCHAR(100) NOT NULL,
        title VARCHAR(100),
        department VARCHAR(100),
        role VARCHAR(30) DEFAULT 'OTHER',
        phone VARCHAR(30),
        mobile VARCHAR(30),
        email VARCHAR(100),
        line_id VARCHAR(50),
        is_primary BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        tags TEXT,
        google_contact_id VARCHAR(255),
        google_resource_name VARCHAR(255),
        sync_status VARCHAR(20) DEFAULT 'PENDING',
        last_synced_at TIMESTAMP,
        last_sync_error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_owner
      ON contacts (owner_type, owner_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_google_id
      ON contacts (google_contact_id)
      WHERE google_contact_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_sync_status
      ON contacts (sync_status)
      WHERE sync_status = 'PENDING'
    `);

    // Migrate data from all legacy contact tables (with IF EXISTS checks)
    await queryRunner.query(`
      DO $$
      BEGIN
        -- Migrate data from customer_contacts (if table exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_contacts' AND table_schema = 'public') THEN
          INSERT INTO contacts (
            id, owner_type, owner_id, name, title, role, phone, email,
            line_id, is_primary, is_active, notes, google_contact_id,
            sync_status, created_at, updated_at
          )
          SELECT
            id, 'CUSTOMER', customer_id, name, title, role, phone, email,
            line_id, is_primary, true, notes, google_contact_id,
            sync_status, created_at, updated_at
          FROM customer_contacts
          ON CONFLICT (id) DO NOTHING;
        END IF;

        -- Migrate data from vendor_contacts (if table exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_contacts' AND table_schema = 'public') THEN
          INSERT INTO contacts (
            id, owner_type, owner_id, name, title, phone, email,
            line_id, is_primary, is_active, notes, google_contact_id,
            sync_status, created_at, updated_at
          )
          SELECT
            id, 'VENDOR', vendor_id, name, title, phone, email,
            line_id, is_primary, true, notes, google_contact_id,
            sync_status, created_at, updated_at
          FROM vendor_contacts
          ON CONFLICT (id) DO NOTHING;
        END IF;

        -- Migrate data from client_contacts (if table exists - clients are merged into customers)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_contacts' AND table_schema = 'public') THEN
          INSERT INTO contacts (
            id, owner_type, owner_id, name, title, department, phone, mobile,
            email, is_primary, is_active, notes, tags, google_resource_name,
            sync_status, last_synced_at, last_sync_error, created_at, updated_at
          )
          SELECT
            id, 'CUSTOMER', client_id, full_name, title, department, phone, mobile,
            email, is_primary, is_active, note, tags::text, google_resource_name,
            sync_status, last_synced_at, last_sync_error, created_at, updated_at
          FROM client_contacts
          ON CONFLICT (id) DO NOTHING;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS contacts`);
  }
}
