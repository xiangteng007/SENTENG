import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Enhance customers table for clients merge
 *
 * - Adds contact_name column from clients table
 * - Prepares for clients → customers consolidation
 */
export class EnhanceCustomersForClientsMerge1769760000000 implements MigrationInterface {
  name = 'EnhanceCustomersForClientsMerge1769760000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add contact_name column to customers table
    await queryRunner.query(`
      ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS contact_name VARCHAR(50)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customers
      DROP COLUMN IF EXISTS contact_name
    `);
  }
}
