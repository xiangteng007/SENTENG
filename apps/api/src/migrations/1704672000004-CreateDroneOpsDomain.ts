import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 建立 DroneOps 領域表
 * Note: FK constraints are added later by migration 1769447303639
 */
export class CreateDroneOpsDomain1704672000004 implements MigrationInterface {
  name = 'CreateDroneOpsDomain1704672000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Service Catalog - Note: FK to business_units added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_catalog" (
        "id" VARCHAR(20) PRIMARY KEY,
        "business_unit_id" VARCHAR(20),
        "name" VARCHAR(100) NOT NULL,
        "category" VARCHAR(30) NOT NULL,
        "description" TEXT,
        "base_unit" VARCHAR(20) NOT NULL,
        "base_price" DECIMAL(12,2) NOT NULL,
        "pricing_rules" JSONB,
        "is_active" BOOLEAN DEFAULT true,
        "effective_from" DATE,
        "effective_to" DATE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Drone Assets - Note: FK to business_units added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "drone_assets" (
        "id" VARCHAR(20) PRIMARY KEY,
        "business_unit_id" VARCHAR(20),
        "asset_type" VARCHAR(30) NOT NULL,
        "model" VARCHAR(100),
        "serial_number" VARCHAR(50) UNIQUE,
        "registration_no" VARCHAR(50),
        "purchase_date" DATE,
        "purchase_cost" DECIMAL(12,2),
        "status" VARCHAR(20) DEFAULT 'AVAILABLE',
        "total_flight_hours" DECIMAL(10,2) DEFAULT 0,
        "total_flight_count" INT DEFAULT 0,
        "last_maintenance_at" TIMESTAMP,
        "next_maintenance_at" TIMESTAMP,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Work Orders - Note: FKs added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "work_orders" (
        "id" VARCHAR(20) PRIMARY KEY,
        "project_id" VARCHAR(20),
        "job_site_id" VARCHAR(20),
        "client_id" VARCHAR(20),
        "business_unit_id" VARCHAR(20),
        "service_id" VARCHAR(20),
        "wo_number" VARCHAR(30) UNIQUE NOT NULL,
        "title" VARCHAR(200),
        "wo_type" VARCHAR(30) NOT NULL,
        "scheduled_date" DATE,
        "scheduled_time_start" TIME,
        "scheduled_time_end" TIME,
        "estimated_area" DECIMAL(12,2),
        "estimated_duration" INT,
        "priority" VARCHAR(20) DEFAULT 'NORMAL',
        "status" VARCHAR(30) DEFAULT 'WO_DRAFT',
        "completed_at" TIMESTAMP,
        "notes" TEXT,
        "created_by" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Dispatch Assignments - Note: FKs added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dispatch_assignments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "work_order_id" VARCHAR(20) NOT NULL,
        "operator_id" VARCHAR(20) NOT NULL,
        "drone_asset_id" VARCHAR(20),
        "assignment_date" DATE NOT NULL,
        "time_window_start" TIME,
        "time_window_end" TIME,
        "status" VARCHAR(20) DEFAULT 'ASSIGNED',
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Preflight Checklists - Note: FKs added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "preflight_checklists" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "work_order_id" VARCHAR(20) NOT NULL,
        "operator_id" VARCHAR(20) NOT NULL,
        "checklist_template" VARCHAR(50),
        "items" JSONB,
        "weather_conditions" JSONB,
        "is_passed" BOOLEAN DEFAULT false,
        "checked_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Flight Logs - Note: FKs added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "flight_logs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "work_order_id" VARCHAR(20) NOT NULL,
        "drone_asset_id" VARCHAR(20),
        "operator_id" VARCHAR(20) NOT NULL,
        "takeoff_time" TIMESTAMP,
        "landing_time" TIMESTAMP,
        "flight_duration" INT,
        "takeoff_lat" DECIMAL(10,7),
        "takeoff_lng" DECIMAL(10,7),
        "landing_lat" DECIMAL(10,7),
        "landing_lng" DECIMAL(10,7),
        "max_altitude" DECIMAL(8,2),
        "distance_flown" DECIMAL(10,2),
        "battery_start" INT,
        "battery_end" INT,
        "trajectory_summary" JSONB,
        "anomalies" JSONB,
        "status" VARCHAR(20) DEFAULT 'COMPLETED',
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Operation Logs - Note: FK added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "operation_logs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "flight_log_id" UUID NOT NULL,
        "operation_type" VARCHAR(30) NOT NULL,
        "start_time" TIMESTAMP,
        "end_time" TIMESTAMP,
        "area_covered" DECIMAL(12,2),
        "volume_used" DECIMAL(10,2),
        "parameters" JSONB,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Maintenance Records - Note: FK added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "maintenance_records" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "asset_id" VARCHAR(20) NOT NULL,
        "maintenance_type" VARCHAR(30) NOT NULL,
        "description" TEXT,
        "performed_by" VARCHAR(20),
        "performed_at" TIMESTAMP,
        "parts_used" JSONB,
        "labor_hours" DECIMAL(5,2),
        "cost" DECIMAL(12,2),
        "next_due_at" TIMESTAMP,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Chemical Lots - Note: FK added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chemical_lots" (
        "id" VARCHAR(20) PRIMARY KEY,
        "business_unit_id" VARCHAR(20),
        "product_name" VARCHAR(100) NOT NULL,
        "manufacturer" VARCHAR(100),
        "lot_number" VARCHAR(50),
        "registration_no" VARCHAR(50),
        "active_ingredient" TEXT,
        "concentration" DECIMAL(8,4),
        "concentration_unit" VARCHAR(20),
        "quantity_received" DECIMAL(12,4) NOT NULL,
        "quantity_remaining" DECIMAL(12,4) NOT NULL,
        "unit" VARCHAR(20) NOT NULL,
        "received_date" DATE,
        "expiry_date" DATE,
        "storage_location" VARCHAR(100),
        "msds_url" TEXT,
        "status" VARCHAR(20) DEFAULT 'IN_STOCK',
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Mixture Batches - Note: FKs added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mixture_batches" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "work_order_id" VARCHAR(20) NOT NULL,
        "batch_number" VARCHAR(50),
        "prepared_by" VARCHAR(20) NOT NULL,
        "prepared_at" TIMESTAMP,
        "chemicals" JSONB NOT NULL,
        "water_volume" DECIMAL(10,2),
        "total_volume" DECIMAL(10,2),
        "dilution_ratio" VARCHAR(20),
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Application Records - Note: FKs added later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "application_records" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "work_order_id" VARCHAR(20) NOT NULL,
        "flight_log_id" UUID,
        "mixture_batch_id" UUID,
        "applied_area" DECIMAL(12,2),
        "applied_volume" DECIMAL(10,2),
        "application_rate" DECIMAL(8,4),
        "weather_conditions" JSONB,
        "gps_track_uri" TEXT,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_work_orders_project_status" ON "work_orders"("project_id", "status")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_work_orders_scheduled" ON "work_orders"("scheduled_date")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_flight_logs_work_order" ON "flight_logs"("work_order_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_chemical_lots_status" ON "chemical_lots"("status")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_chemical_lots_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_flight_logs_work_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_work_orders_scheduled"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_work_orders_project_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "application_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mixture_batches"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chemical_lots"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "maintenance_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "operation_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "flight_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "preflight_checklists"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dispatch_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "work_orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "drone_assets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_catalog"`);
  }
}
