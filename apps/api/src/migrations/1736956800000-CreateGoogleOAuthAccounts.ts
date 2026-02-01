/**
 * CreateGoogleOAuthAccounts Migration
 *
 * Creates the google_oauth_accounts table for storing OAuth credentials
 */
import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateGoogleOAuthAccounts1736956800000 implements MigrationInterface {
  name = "CreateGoogleOAuthAccounts1736956800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "google_oauth_accounts",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "gen_random_uuid()",
          },
          {
            name: "user_id",
            type: "varchar",
            length: "50",
            isNullable: false,
          },
          {
            name: "google_account_email",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "access_token",
            type: "text",
            isNullable: false,
          },
          {
            name: "refresh_token",
            type: "text",
            isNullable: true,
          },
          {
            name: "token_expires_at",
            type: "timestamp",
            isNullable: false,
          },
          {
            name: "scopes",
            type: "text",
            isNullable: false,
          },
          {
            name: "calendar_id",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "contacts_label",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "auto_sync_events",
            type: "boolean",
            default: true,
          },
          {
            name: "auto_sync_contacts",
            type: "boolean",
            default: true,
          },
          {
            name: "is_active",
            type: "boolean",
            default: true,
          },
          {
            name: "last_synced_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "last_sync_error",
            type: "text",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // Create index on user_id
    await queryRunner.createIndex(
      "google_oauth_accounts",
      new TableIndex({
        name: "IDX_google_oauth_accounts_user_id",
        columnNames: ["user_id"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      "google_oauth_accounts",
      "IDX_google_oauth_accounts_user_id",
    );
    await queryRunner.dropTable("google_oauth_accounts");
  }
}
