import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * CreateProjectPartnersTable Migration
 *
 * 建立 project_partners 中間表 - 連結專案與合作夥伴
 * 支援角色（承包商/供應商/設計師等）和合約資訊
 */
export class CreateProjectPartnersTable1770403800000
  implements MigrationInterface
{
  name = "CreateProjectPartnersTable1770403800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 建立 project_partners 表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS project_partners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id VARCHAR(20) NOT NULL,
        partner_id UUID NOT NULL,
        role VARCHAR(30) NOT NULL DEFAULT 'CONTRACTOR',
        contract_amount DECIMAL(15, 2),
        start_date DATE,
        end_date DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(20),
        CONSTRAINT fk_project_partners_project FOREIGN KEY (project_id) 
          REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_project_partners_partner FOREIGN KEY (partner_id) 
          REFERENCES partners(id) ON DELETE CASCADE,
        CONSTRAINT uq_project_partner UNIQUE (project_id, partner_id)
      );
    `);

    // 建立索引
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_project_partners_project_id 
      ON project_partners(project_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_project_partners_partner_id 
      ON project_partners(partner_id);
    `);

    // 新增 Comment
    await queryRunner.query(`
      COMMENT ON TABLE project_partners IS 'Project-Partner M2M relation - 專案與合作夥伴關聯';
      COMMENT ON COLUMN project_partners.role IS 'CONTRACTOR | SUBCONTRACTOR | SUPPLIER | DESIGNER | CONSULTANT | OTHER';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS project_partners;`);
  }
}
