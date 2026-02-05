import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddGoogleCalendarSyncToEvents1738771200000
  implements MigrationInterface
{
  name = "AddGoogleCalendarSyncToEvents1738771200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const eventsTableExists = await queryRunner.hasTable("events");
    if (!eventsTableExists) {
      console.log("Events table does not exist, skipping migration");
      return;
    }

    // Check if columns already exist before adding
    const table = await queryRunner.getTable("events");
    const columnNames = table?.columns.map((c) => c.name) || [];

    // Add google_event_id if not exists
    if (!columnNames.includes("google_event_id")) {
      await queryRunner.addColumn(
        "events",
        new TableColumn({
          name: "google_event_id",
          type: "varchar",
          length: "200",
          isNullable: true,
        })
      );
    }

    // Add google_calendar_id if not exists
    if (!columnNames.includes("google_calendar_id")) {
      await queryRunner.addColumn(
        "events",
        new TableColumn({
          name: "google_calendar_id",
          type: "varchar",
          length: "200",
          isNullable: true,
        })
      );
    }

    // Add sync_status if not exists
    if (!columnNames.includes("sync_status")) {
      await queryRunner.addColumn(
        "events",
        new TableColumn({
          name: "sync_status",
          type: "varchar",
          length: "20",
          default: "'PENDING'",
        })
      );
    }

    // Add last_sync_error if not exists
    if (!columnNames.includes("last_sync_error")) {
      await queryRunner.addColumn(
        "events",
        new TableColumn({
          name: "last_sync_error",
          type: "text",
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const eventsTableExists = await queryRunner.hasTable("events");
    if (!eventsTableExists) {
      return;
    }

    const table = await queryRunner.getTable("events");
    const columnNames = table?.columns.map((c) => c.name) || [];

    if (columnNames.includes("last_sync_error")) {
      await queryRunner.dropColumn("events", "last_sync_error");
    }
    if (columnNames.includes("sync_status")) {
      await queryRunner.dropColumn("events", "sync_status");
    }
    if (columnNames.includes("google_calendar_id")) {
      await queryRunner.dropColumn("events", "google_calendar_id");
    }
    if (columnNames.includes("google_event_id")) {
      await queryRunner.dropColumn("events", "google_event_id");
    }
  }
}
