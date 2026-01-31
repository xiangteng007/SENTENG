-- ============================================================
-- SENTENG ERP Data Migration Script
-- P0: Unified Contact Migration
-- P1: customers → clients Migration
-- ============================================================
-- USAGE: Execute in PostgreSQL database
-- BACKUP your database before running this script!
-- ============================================================
BEGIN;
-- ============================================================
-- Part 1: Migrate vendor_contacts → contacts (owner_type=VENDOR)
-- ============================================================
INSERT INTO contacts (
        id,
        owner_type,
        owner_id,
        name,
        title,
        department,
        role,
        phone,
        mobile,
        email,
        line_id,
        is_primary,
        is_active,
        notes,
        google_contact_id,
        sync_status,
        created_at,
        updated_at
    )
SELECT vc.id::uuid,
    'VENDOR' as owner_type,
    vc.vendor_id as owner_id,
    vc.name,
    vc.title,
    NULL as department,
    'OTHER' as role,
    vc.phone,
    NULL as mobile,
    vc.email,
    vc.line_id,
    vc.is_primary,
    true as is_active,
    vc.notes,
    vc.google_contact_id,
    COALESCE(vc.sync_status, 'PENDING') as sync_status,
    vc.created_at,
    vc.updated_at
FROM vendor_contacts vc
WHERE NOT EXISTS (
        SELECT 1
        FROM contacts c
        WHERE c.owner_type = 'VENDOR'
            AND c.owner_id = vc.vendor_id
            AND c.name = vc.name
    );
-- ============================================================
-- Part 2: Migrate client_contacts → contacts (owner_type=CLIENT)
-- ============================================================
INSERT INTO contacts (
        id,
        owner_type,
        owner_id,
        name,
        title,
        department,
        role,
        phone,
        mobile,
        email,
        line_id,
        is_primary,
        is_active,
        notes,
        google_contact_id,
        sync_status,
        created_at,
        updated_at
    )
SELECT cc.id::uuid,
    'CUSTOMER' as owner_type,
    -- Using CUSTOMER for clients
    cc.client_id as owner_id,
    cc.name,
    cc.title,
    cc.department,
    COALESCE(cc.role, 'OTHER') as role,
    cc.phone,
    cc.mobile,
    cc.email,
    cc.line_id,
    cc.is_primary,
    true as is_active,
    cc.notes,
    cc.google_contact_id,
    COALESCE(cc.sync_status, 'PENDING') as sync_status,
    cc.created_at,
    cc.updated_at
FROM client_contacts cc
WHERE NOT EXISTS (
        SELECT 1
        FROM contacts c
        WHERE c.owner_type = 'CUSTOMER'
            AND c.owner_id = cc.client_id
            AND c.name = cc.name
    );
-- ============================================================
-- Part 3: Migrate customers → clients (if not already migrated)
-- ============================================================
INSERT INTO clients (
        id,
        name,
        type,
        tax_id,
        contact_name,
        phone,
        email,
        address,
        default_currency,
        credit_days,
        credit_rating,
        notes,
        line_id,
        source,
        budget,
        drive_folder,
        status,
        created_at,
        created_by,
        updated_at,
        updated_by
    )
SELECT cu.id,
    cu.name,
    COALESCE(cu.type, 'COMPANY') as type,
    cu.tax_id,
    cu.contact_name,
    cu.phone,
    cu.email,
    cu.address,
    COALESCE(cu.default_currency, 'TWD') as default_currency,
    COALESCE(cu.credit_days, 30) as credit_days,
    COALESCE(cu.credit_rating, 'B') as credit_rating,
    cu.notes,
    cu.line_id,
    cu.source,
    NULL as budget,
    cu.drive_folder,
    COALESCE(cu.status, 'ACTIVE') as status,
    cu.created_at,
    cu.created_by,
    cu.updated_at,
    cu.updated_by
FROM customers cu
WHERE NOT EXISTS (
        SELECT 1
        FROM clients cl
        WHERE cl.id = cu.id
    );
-- ============================================================
-- Part 4: Verification Queries
-- ============================================================
-- Count migrated records
SELECT 'vendor_contacts migrated' as migration,
    COUNT(*) as count
FROM contacts
WHERE owner_type = 'VENDOR';
SELECT 'client_contacts migrated' as migration,
    COUNT(*) as count
FROM contacts
WHERE owner_type = 'CUSTOMER';
SELECT 'customers migrated to clients' as migration,
    COUNT(*) as count
FROM clients;
COMMIT;
-- ============================================================
-- Post-Migration Cleanup (ONLY RUN AFTER VERIFICATION!)
-- Uncomment these lines after confirming migration success
-- ============================================================
-- DROP TABLE IF EXISTS vendor_contacts CASCADE;
-- DROP TABLE IF EXISTS client_contacts CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;