import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 2.3: Schedule/Gantt Module Tables
 */
export class CreateScheduleTables1769760500000 implements MigrationInterface {
  name = "CreateScheduleTables1769760500000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Schedule tasks (Gantt chart items)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "schedule_tasks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "progress" int DEFAULT 0,
        "type" varchar(50) DEFAULT 'task',
        "status" varchar(50) DEFAULT 'pending',
        "parent_id" uuid,
        "dependencies" text[],
        "assignee" varchar(100),
        "assignee_id" uuid,
        "color" varchar(7) DEFAULT '#3B82F6',
        "sort_order" int DEFAULT 0,
        "estimated_cost" decimal(10,2),
        "actual_cost" decimal(10,2),
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    // Schedule dependencies (task relationships)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "schedule_dependencies" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "task_id" uuid NOT NULL,
        "depends_on_task_id" uuid NOT NULL,
        "type" varchar(20) DEFAULT 'finish_to_start',
        "lag_days" int DEFAULT 0,
        "created_at" timestamp DEFAULT now()
      )
    `);

    // Schedule milestones
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "schedule_milestones" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "target_date" date NOT NULL,
        "actual_date" date,
        "status" varchar(50) DEFAULT 'pending',
        "is_contractual" boolean DEFAULT false,
        "payment_amount" decimal(10,2),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_schedule_tasks_project_start" 
      ON "schedule_tasks" ("project_id", "start_date")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_schedule_tasks_parent" 
      ON "schedule_tasks" ("parent_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_schedule_tasks_status" 
      ON "schedule_tasks" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_schedule_dependencies_task" 
      ON "schedule_dependencies" ("task_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_schedule_milestones_project" 
      ON "schedule_milestones" ("project_id", "target_date")
    `);

    // Add foreign key constraints (with IF NOT EXISTS check)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_schedule_dep_task' AND table_name = 'schedule_dependencies'
        ) THEN
          ALTER TABLE "schedule_dependencies" 
          ADD CONSTRAINT "fk_schedule_dep_task" 
          FOREIGN KEY ("task_id") REFERENCES "schedule_tasks"("id") ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_schedule_dep_depends_on' AND table_name = 'schedule_dependencies'
        ) THEN
          ALTER TABLE "schedule_dependencies" 
          ADD CONSTRAINT "fk_schedule_dep_depends_on" 
          FOREIGN KEY ("depends_on_task_id") REFERENCES "schedule_tasks"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "schedule_dependencies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "schedule_milestones"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "schedule_tasks"`);
  }
}
