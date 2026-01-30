import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddPhase2Entities1706900000000 implements MigrationInterface {
  name = 'AddPhase2Entities1706900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Audit Logs (skip if already exists from CreatePlatformCore migration)
    const hasAuditLogs = await queryRunner.hasTable('audit_logs');
    if (!hasAuditLogs) {
      await queryRunner.createTable(
        new Table({
          name: 'audit_logs',
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
            { name: 'action', type: 'varchar', length: '50' },
            { name: 'entity_type', type: 'varchar', length: '100' },
            { name: 'entity_id', type: 'varchar', length: '100', isNullable: true },
            { name: 'entity_name', type: 'varchar', length: '100', isNullable: true },
            { name: 'user_id', type: 'uuid', isNullable: true },
            { name: 'user_email', type: 'varchar', length: '255', isNullable: true },
            { name: 'user_name', type: 'varchar', length: '100', isNullable: true },
            { name: 'old_value', type: 'jsonb', isNullable: true },
            { name: 'new_value', type: 'jsonb', isNullable: true },
            { name: 'changes', type: 'jsonb', isNullable: true },
            { name: 'ip_address', type: 'varchar', length: '45', isNullable: true },
            { name: 'user_agent', type: 'text', isNullable: true },
            { name: 'request_path', type: 'varchar', length: '255', isNullable: true },
            { name: 'request_method', type: 'varchar', length: '10', isNullable: true },
            { name: 'description', type: 'text', isNullable: true },
            { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
          ],
        }),
        true
      );

      await queryRunner.createIndex(
        'audit_logs',
        new TableIndex({
          name: 'idx_audit_logs_entity',
          columnNames: ['entity_type', 'entity_id'],
        })
      );

      await queryRunner.createIndex(
        'audit_logs',
        new TableIndex({
          name: 'idx_audit_logs_user',
          columnNames: ['user_id', 'created_at'],
        })
      );
    }

    // 2. Schedule Tasks (Gantt)
    await queryRunner.createTable(
      new Table({
        name: 'schedule_tasks',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'project_id', type: 'uuid' },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'start_date', type: 'date' },
          { name: 'end_date', type: 'date' },
          { name: 'progress', type: 'int', default: 0 },
          { name: 'type', type: 'varchar', length: '50', default: "'task'" },
          { name: 'status', type: 'varchar', length: '50', default: "'pending'" },
          { name: 'parent_id', type: 'uuid', isNullable: true },
          { name: 'dependencies', type: 'text', isNullable: true },
          { name: 'assignee', type: 'varchar', length: '100', isNullable: true },
          { name: 'assignee_id', type: 'uuid', isNullable: true },
          { name: 'color', type: 'varchar', length: '7', default: "'#3B82F6'" },
          { name: 'sort_order', type: 'int', default: 0 },
          { name: 'estimated_cost', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'actual_cost', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
          { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' },
        ],
      }),
      true
    );

    // 3. Schedule Milestones
    await queryRunner.createTable(
      new Table({
        name: 'schedule_milestones',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'project_id', type: 'uuid' },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'target_date', type: 'date' },
          { name: 'actual_date', type: 'date', isNullable: true },
          { name: 'status', type: 'varchar', length: '50', default: "'pending'" },
          { name: 'is_contractual', type: 'boolean', default: false },
          { name: 'payment_amount', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
          { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' },
        ],
      }),
      true
    );

    // 4. Site Photos
    await queryRunner.createTable(
      new Table({
        name: 'site_photos',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'project_id', type: 'uuid' },
          { name: 'task_id', type: 'uuid', isNullable: true },
          { name: 'file_url', type: 'varchar', length: '500' },
          { name: 'thumbnail_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'file_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'file_size', type: 'int', isNullable: true },
          { name: 'mime_type', type: 'varchar', length: '50', isNullable: true },
          { name: 'caption', type: 'varchar', length: '255', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'latitude', type: 'decimal', precision: 10, scale: 7, isNullable: true },
          { name: 'longitude', type: 'decimal', precision: 10, scale: 7, isNullable: true },
          { name: 'altitude', type: 'decimal', precision: 6, scale: 2, isNullable: true },
          { name: 'heading', type: 'int', isNullable: true },
          { name: 'captured_at', type: 'timestamp with time zone' },
          { name: 'captured_by', type: 'varchar', length: '255', isNullable: true },
          { name: 'captured_by_user_id', type: 'uuid', isNullable: true },
          { name: 'category', type: 'varchar', length: '100', isNullable: true },
          { name: 'tags', type: 'text', isNullable: true },
          { name: 'construction_phase', type: 'varchar', length: '100', isNullable: true },
          { name: 'location', type: 'varchar', length: '100', isNullable: true },
          { name: 'status', type: 'varchar', length: '50', default: "'pending'" },
          { name: 'approved_by', type: 'uuid', isNullable: true },
          { name: 'approved_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'exif_data', type: 'jsonb', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'is_deleted', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
        ],
      }),
      true
    );

    // 5. Contract Versions
    await queryRunner.createTable(
      new Table({
        name: 'contract_versions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'contract_id', type: 'uuid' },
          { name: 'version', type: 'int' },
          { name: 'version_label', type: 'varchar', length: '50' },
          { name: 'status', type: 'varchar', length: '50' },
          { name: 'content', type: 'text', isNullable: true },
          { name: 'structured_content', type: 'jsonb', isNullable: true },
          { name: 'change_description', type: 'text', isNullable: true },
          { name: 'changes', type: 'jsonb', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'created_by_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'approved_by', type: 'uuid', isNullable: true },
          { name: 'approved_by_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'approved_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'attachments', type: 'jsonb', isNullable: true },
          { name: 'signatures', type: 'jsonb', isNullable: true },
          { name: 'is_signed', type: 'boolean', default: false },
          { name: 'contract_amount', type: 'decimal', precision: 15, scale: 2, isNullable: true },
          { name: 'previous_amount', type: 'decimal', precision: 15, scale: 2, isNullable: true },
          { name: 'amount_change', type: 'decimal', precision: 15, scale: 2, isNullable: true },
          { name: 'content_hash', type: 'varchar', length: '64', isNullable: true },
          { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'contract_versions',
      new TableIndex({
        name: 'idx_contract_versions_contract',
        columnNames: ['contract_id', 'version'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('contract_versions');
    await queryRunner.dropTable('site_photos');
    await queryRunner.dropTable('schedule_milestones');
    await queryRunner.dropTable('schedule_tasks');
    await queryRunner.dropTable('audit_logs');
  }
}
