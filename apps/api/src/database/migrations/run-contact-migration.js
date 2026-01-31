/**
 * Contact Migration Script Runner V2
 * Executes the contact unification migration with SAVEPOINT support
 */
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_DATABASE || 'erp',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: false, // Using Cloud SQL Proxy locally
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to:', process.env.DB_HOST + ':' + process.env.DB_PORT);

    // Check if tables exist
    console.log('\n📊 Checking existing tables...');
    const tablesCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('vendor_contacts', 'client_contacts', 'customers', 'contacts', 'clients')
    `);
    const existingTables = tablesCheck.rows.map(r => r.table_name);
    console.log('Found tables:', existingTables.join(', '));

    // Count records before migration
    console.log('\n📈 Pre-migration counts:');
    for (const table of existingTables) {
      const count = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`  ${table}: ${count.rows[0].count} records`);
    }

    // Start transaction
    console.log('\n🔄 Starting migration transaction...');
    await client.query('BEGIN');

    let migratedVendorContacts = 0;
    let migratedClientContacts = 0;
    let migratedCustomers = 0;

    // Part 1: Migrate vendor_contacts → contacts (if exists)
    if (existingTables.includes('vendor_contacts')) {
      console.log('\n📦 Part 1: Migrating vendor_contacts → contacts...');
      try {
        await client.query('SAVEPOINT part1');
        const result1 = await client.query(`
          INSERT INTO contacts (
            id, owner_type, owner_id, name, title, department, role,
            phone, mobile, email, line_id, is_primary, is_active,
            notes, google_contact_id, sync_status, created_at, updated_at
          )
          SELECT 
            vc.id::uuid, 'VENDOR', vc.vendor_id, vc.name, vc.title, NULL, 'OTHER',
            vc.phone, NULL, vc.email, vc.line_id, vc.is_primary, true,
            vc.notes, vc.google_contact_id, COALESCE(vc.sync_status, 'PENDING'),
            vc.created_at, vc.updated_at
          FROM vendor_contacts vc
          WHERE NOT EXISTS (
            SELECT 1 FROM contacts c 
            WHERE c.owner_type = 'VENDOR' AND c.owner_id = vc.vendor_id AND c.name = vc.name
          )
        `);
        migratedVendorContacts = result1.rowCount;
        console.log(`  ✅ Migrated ${migratedVendorContacts} vendor contacts`);
      } catch (e) {
        console.log('  ⚠️ Part 1 Error:', e.message);
        await client.query('ROLLBACK TO SAVEPOINT part1');
      }
    } else {
      console.log('\n⏭️ Part 1: vendor_contacts table does not exist, skipping');
    }

    // Part 2: Migrate client_contacts → contacts (if exists)
    if (existingTables.includes('client_contacts')) {
      console.log('\n📦 Part 2: Migrating client_contacts → contacts...');
      try {
        await client.query('SAVEPOINT part2');
        const result2 = await client.query(`
          INSERT INTO contacts (
            id, owner_type, owner_id, name, title, department, role,
            phone, mobile, email, line_id, is_primary, is_active,
            notes, google_contact_id, sync_status, created_at, updated_at
          )
          SELECT 
            cc.id::uuid, 'CUSTOMER', cc.client_id, cc.full_name, cc.title, cc.department, 
            'OTHER', cc.phone, cc.mobile, cc.email, NULL, 
            cc.is_primary, COALESCE(cc.is_active, true), cc.note, cc.google_resource_name, 
            COALESCE(cc.sync_status, 'PENDING'), cc.created_at, cc.updated_at
          FROM client_contacts cc
          WHERE NOT EXISTS (
            SELECT 1 FROM contacts c 
            WHERE c.owner_type = 'CUSTOMER' AND c.owner_id = cc.client_id AND c.name = cc.full_name
          )
        `);
        migratedClientContacts = result2.rowCount;
        console.log(`  ✅ Migrated ${migratedClientContacts} client contacts`);
      } catch (e) {
        console.log('  ⚠️ Part 2 Error:', e.message);
        await client.query('ROLLBACK TO SAVEPOINT part2');
      }
    } else {
      console.log('\n⏭️ Part 2: client_contacts table does not exist, skipping');
    }

    // Part 3: Migrate customers → clients (if exists)
    if (existingTables.includes('customers')) {
      console.log('\n📦 Part 3: Migrating customers → clients...');
      try {
        await client.query('SAVEPOINT part3');
        const result3 = await client.query(`
          INSERT INTO clients (
            id, name, type, tax_id, contact_name, phone, email, address,
            default_currency, credit_days, credit_rating, notes, line_id,
            source, budget, drive_folder, status, created_at, created_by,
            updated_at, updated_by
          )
          SELECT 
            cu.id, cu.name, COALESCE(cu.type, 'COMPANY'), cu.tax_id, cu.contact_name,
            cu.phone, cu.email, cu.address, COALESCE(cu.default_currency, 'TWD'),
            COALESCE(cu.credit_days, 30), COALESCE(cu.credit_rating, 'B'), cu.notes,
            cu.line_id, cu.source, NULL, cu.drive_folder, COALESCE(cu.status, 'ACTIVE'),
            cu.created_at, cu.created_by, cu.updated_at, cu.updated_by
          FROM customers cu
          WHERE NOT EXISTS (SELECT 1 FROM clients cl WHERE cl.id = cu.id)
        `);
        migratedCustomers = result3.rowCount;
        console.log(`  ✅ Migrated ${migratedCustomers} customers to clients`);
      } catch (e) {
        console.log('  ⚠️ Part 3 Error:', e.message);
        await client.query('ROLLBACK TO SAVEPOINT part3');
      }
    } else {
      console.log('\n⏭️ Part 3: customers table does not exist, skipping');
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Migration committed successfully!');

    // Post-migration counts
    console.log('\n📈 Post-migration counts:');
    const vendorCount = await client.query(`SELECT COUNT(*) FROM contacts WHERE owner_type = 'VENDOR'`);
    const clientCount = await client.query(`SELECT COUNT(*) FROM contacts WHERE owner_type = 'CUSTOMER'`);
    const allClientsCount = await client.query(`SELECT COUNT(*) FROM clients`);
    
    console.log(`  contacts (VENDOR): ${vendorCount.rows[0].count}`);
    console.log(`  contacts (CUSTOMER): ${clientCount.rows[0].count}`);
    console.log(`  clients: ${allClientsCount.rows[0].count}`);

    // Summary
    console.log('\n📋 Migration Summary:');
    console.log(`  Vendor contacts migrated: ${migratedVendorContacts}`);
    console.log(`  Client contacts migrated: ${migratedClientContacts}`);
    console.log(`  Customers migrated: ${migratedCustomers}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    try {
      await client.query('ROLLBACK');
      console.log('🔙 Transaction rolled back');
    } catch (e) {}
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

runMigration();
