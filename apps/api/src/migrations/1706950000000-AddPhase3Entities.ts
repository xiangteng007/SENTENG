import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class AddPhase3Entities1706950000000 implements MigrationInterface {
  name = "AddPhase3Entities1706950000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Project Insurances
    await queryRunner.createTable(
      new Table({
        name: "project_insurances",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          { name: "project_id", type: "uuid" },
          { name: "type", type: "varchar", length: "100" },
          { name: "policy_number", type: "varchar", length: "255" },
          { name: "insurer_name", type: "varchar", length: "255" },
          {
            name: "insurer_code",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          { name: "effective_date", type: "date" },
          { name: "expiry_date", type: "date" },
          { name: "coverage_amount", type: "decimal", precision: 15, scale: 2 },
          { name: "premium_amount", type: "decimal", precision: 12, scale: 2 },
          {
            name: "status",
            type: "varchar",
            length: "50",
            default: "'active'",
          },
          { name: "insured_name", type: "varchar", length: "255" },
          {
            name: "insured_tax_id",
            type: "varchar",
            length: "20",
            isNullable: true,
          },
          {
            name: "beneficiary_name",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          { name: "endorsements", type: "jsonb", isNullable: true },
          { name: "claims", type: "jsonb", isNullable: true },
          { name: "documents", type: "jsonb", isNullable: true },
          {
            name: "rate_percent",
            type: "decimal",
            precision: 6,
            scale: 4,
            isNullable: true,
          },
          { name: "coverage_description", type: "text", isNullable: true },
          { name: "exclusions", type: "text", isNullable: true },
          { name: "reminder_days_before", type: "int", default: 30 },
          { name: "reminder_enabled", type: "boolean", default: true },
          {
            name: "last_reminder_sent_at",
            type: "timestamp with time zone",
            isNullable: true,
          },
          {
            name: "agent_name",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "agent_phone",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "agent_email",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          { name: "notes", type: "text", isNullable: true },
          {
            name: "created_at",
            type: "timestamp with time zone",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp with time zone",
            default: "now()",
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "project_insurances",
      new TableIndex({
        name: "idx_project_insurances_project_type",
        columnNames: ["project_id", "type"],
      }),
    );

    await queryRunner.createIndex(
      "project_insurances",
      new TableIndex({
        name: "idx_project_insurances_expiry",
        columnNames: ["expiry_date"],
      }),
    );

    // 2. Insurance Rate References
    await queryRunner.createTable(
      new Table({
        name: "insurance_rate_references",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          { name: "insurance_type", type: "varchar", length: "100" },
          { name: "construction_type", type: "varchar", length: "100" },
          { name: "base_rate", type: "decimal", precision: 6, scale: 4 },
          {
            name: "min_rate",
            type: "decimal",
            precision: 6,
            scale: 4,
            isNullable: true,
          },
          {
            name: "max_rate",
            type: "decimal",
            precision: 6,
            scale: 4,
            isNullable: true,
          },
          { name: "description", type: "text", isNullable: true },
          { name: "is_active", type: "boolean", default: true },
          {
            name: "created_at",
            type: "timestamp with time zone",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // 3. Waste Records
    await queryRunner.createTable(
      new Table({
        name: "waste_records",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          { name: "project_id", type: "uuid" },
          { name: "waste_type", type: "varchar", length: "100" },
          { name: "waste_code", type: "varchar", length: "10" },
          { name: "waste_date", type: "date" },
          { name: "quantity", type: "decimal", precision: 10, scale: 2 },
          { name: "unit", type: "varchar", length: "20", default: "'ton'" },
          {
            name: "status",
            type: "varchar",
            length: "50",
            default: "'generated'",
          },
          {
            name: "disposer_name",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "disposer_license_no",
            type: "varchar",
            length: "20",
            isNullable: true,
          },
          {
            name: "disposal_facility",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "transporter_name",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "vehicle_plate",
            type: "varchar",
            length: "20",
            isNullable: true,
          },
          {
            name: "transport_date",
            type: "timestamp with time zone",
            isNullable: true,
          },
          {
            name: "disposal_method",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "disposal_date",
            type: "timestamp with time zone",
            isNullable: true,
          },
          {
            name: "manifest_number",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          { name: "manifest_submitted", type: "boolean", default: false },
          {
            name: "manifest_submitted_at",
            type: "timestamp with time zone",
            isNullable: true,
          },
          { name: "is_recyclable", type: "boolean", default: false },
          {
            name: "recycled_quantity",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "recycler_name",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "disposal_cost",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: "transport_cost",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: "generation_location",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "latitude",
            type: "decimal",
            precision: 10,
            scale: 7,
            isNullable: true,
          },
          {
            name: "longitude",
            type: "decimal",
            precision: 10,
            scale: 7,
            isNullable: true,
          },
          { name: "documents", type: "jsonb", isNullable: true },
          { name: "notes", type: "text", isNullable: true },
          { name: "created_by", type: "uuid", isNullable: true },
          { name: "approved_by", type: "uuid", isNullable: true },
          {
            name: "approved_at",
            type: "timestamp with time zone",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp with time zone",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp with time zone",
            default: "now()",
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "waste_records",
      new TableIndex({
        name: "idx_waste_records_project_date",
        columnNames: ["project_id", "waste_date"],
      }),
    );

    // 4. Waste Monthly Reports
    await queryRunner.createTable(
      new Table({
        name: "waste_monthly_reports",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          { name: "project_id", type: "uuid" },
          { name: "year", type: "int" },
          { name: "month", type: "int" },
          { name: "summary", type: "jsonb" },
          {
            name: "total_disposal_cost",
            type: "decimal",
            precision: 12,
            scale: 2,
          },
          {
            name: "total_transport_cost",
            type: "decimal",
            precision: 12,
            scale: 2,
          },
          {
            name: "overall_recycle_rate",
            type: "decimal",
            precision: 5,
            scale: 2,
          },
          { name: "status", type: "varchar", length: "50", default: "'draft'" },
          {
            name: "submitted_at",
            type: "timestamp with time zone",
            isNullable: true,
          },
          {
            name: "epa_report_number",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp with time zone",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp with time zone",
            default: "now()",
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "waste_monthly_reports",
      new TableIndex({
        name: "idx_waste_monthly_reports_project_period",
        columnNames: ["project_id", "year", "month"],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("waste_monthly_reports");
    await queryRunner.dropTable("waste_records");
    await queryRunner.dropTable("insurance_rate_references");
    await queryRunner.dropTable("project_insurances");
  }
}
