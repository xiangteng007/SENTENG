import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 2.1.1: Weather Alert Table
 * 用於記錄已發送的天氣警報，避免重複推播
 */
export class CreateWeatherAlertsTable1769782800000 implements MigrationInterface {
  name = "CreateWeatherAlertsTable1769782800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 建立 weather_alert_type 列舉
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'weather_alert_type_enum') THEN
          CREATE TYPE weather_alert_type_enum AS ENUM (
            'HEAVY_RAIN', 'TORRENTIAL_RAIN', 'TYPHOON', 
            'LOW_TEMPERATURE', 'STRONG_WIND', 'FOG', 
            'HIGH_TEMPERATURE', 'OTHER'
          );
        END IF;
      END $$;
    `);

    // 建立 weather_alerts 表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "weather_alerts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "alert_id" varchar(100) NOT NULL,
        "type" weather_alert_type_enum DEFAULT 'OTHER',
        "phenomena" varchar(100) NOT NULL,
        "significance" varchar(50),
        "location_name" varchar(100) NOT NULL,
        "geocode" varchar(20),
        "details" text,
        "start_time" timestamp,
        "end_time" timestamp,
        "issue_time" timestamp,
        "notification_sent" boolean DEFAULT false,
        "sent_at" timestamp,
        "sent_channels" text,
        "send_error" text,
        "created_at" timestamp DEFAULT now()
      )
    `);

    // 建立索引
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_weather_alerts_alert_id" 
      ON "weather_alerts" ("alert_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_weather_alerts_location_time" 
      ON "weather_alerts" ("phenomena", "location_name", "start_time")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_weather_alerts_created" 
      ON "weather_alerts" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "weather_alerts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS weather_alert_type_enum`);
  }
}
