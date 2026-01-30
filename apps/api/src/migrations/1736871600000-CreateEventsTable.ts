import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateEventsTable1736871600000 implements MigrationInterface {
  name = 'CreateEventsTable1736871600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'start_time',
            type: 'timestamp',
          },
          {
            name: 'end_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'all_day',
            type: 'boolean',
            default: false,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '30',
            default: "'general'",
          },
          {
            name: 'color',
            type: 'varchar',
            length: '20',
            default: "'#3b82f6'",
          },
          {
            name: 'location',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'project_id',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'recurrence_rule',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'recurrence_end',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'external_source',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'last_synced_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'reminder_minutes',
            type: 'int',
            default: 30,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'scheduled'",
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add foreign key to projects table ONLY if projects table exists
    // (projects table is created by later migration 1769447303639)
    const projectsTableExists = await queryRunner.hasTable('projects');
    if (projectsTableExists) {
      await queryRunner.createForeignKey(
        'events',
        new TableForeignKey({
          columnNames: ['project_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'projects',
          onDelete: 'SET NULL',
        })
      );
    }

    // Create indexes for common queries
    await queryRunner.createIndex(
      'events',
      new TableIndex({
        name: 'IDX_events_start_time',
        columnNames: ['start_time'],
      })
    );

    await queryRunner.createIndex(
      'events',
      new TableIndex({
        name: 'IDX_events_project_id',
        columnNames: ['project_id'],
      })
    );

    await queryRunner.createIndex(
      'events',
      new TableIndex({
        name: 'IDX_events_status',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'events',
      new TableIndex({
        name: 'IDX_events_external_id',
        columnNames: ['external_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('events', 'IDX_events_external_id');
    await queryRunner.dropIndex('events', 'IDX_events_status');
    await queryRunner.dropIndex('events', 'IDX_events_project_id');
    await queryRunner.dropIndex('events', 'IDX_events_start_time');

    // Drop foreign key
    const table = await queryRunner.getTable('events');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('project_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('events', foreignKey);
    }

    // Drop table
    await queryRunner.dropTable('events');
  }
}
