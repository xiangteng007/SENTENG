import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingColumnsToProjects1738540800000 implements MigrationInterface {
  name = "AddMissingColumnsToProjects1738540800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if completion_percentage column exists
    const hasCompletionPercentage = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'completion_percentage'
    `);

    if (hasCompletionPercentage.length === 0) {
      console.log("Adding completion_percentage column to projects table...");
      await queryRunner.query(`
        ALTER TABLE projects 
        ADD COLUMN completion_percentage DECIMAL(5,2) DEFAULT 0
      `);
      console.log("✅ Added completion_percentage column");
    } else {
      console.log("✅ completion_percentage column already exists");
    }

    // Check if recognized_revenue column exists
    const hasRecognizedRevenue = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'recognized_revenue'
    `);

    if (hasRecognizedRevenue.length === 0) {
      console.log("Adding recognized_revenue column to projects table...");
      await queryRunner.query(`
        ALTER TABLE projects 
        ADD COLUMN recognized_revenue DECIMAL(15,2) DEFAULT 0
      `);
      console.log("✅ Added recognized_revenue column");
    } else {
      console.log("✅ recognized_revenue column already exists");
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop columns if they exist
    const hasCompletionPercentage = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'completion_percentage'
    `);

    if (hasCompletionPercentage.length > 0) {
      await queryRunner.query(`ALTER TABLE projects DROP COLUMN completion_percentage`);
    }

    const hasRecognizedRevenue = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'recognized_revenue'
    `);

    if (hasRecognizedRevenue.length > 0) {
      await queryRunner.query(`ALTER TABLE projects DROP COLUMN recognized_revenue`);
    }
  }
}
