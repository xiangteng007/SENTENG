import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCmmTaxonomyAndRuns1737936000000 implements MigrationInterface {
  name = 'CreateCmmTaxonomyAndRuns1737936000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. Category Taxonomy Tables (營建/裝潢分類體系)
    // ============================================

    // Level 1: Top-level categories (營建/裝潢)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cmm_category_l1 (
        code VARCHAR(20) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Level 2: Trade groups (土方、模板、油漆、木作...)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cmm_category_l2 (
        code VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        l1_code VARCHAR(20) NOT NULL REFERENCES cmm_category_l1(code),
        default_unit VARCHAR(20),
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Level 3: Work item templates (工項模板)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cmm_category_l3 (
        code VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        l2_code VARCHAR(50) NOT NULL REFERENCES cmm_category_l2(code),
        default_materials JSONB,
        default_params JSONB,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ============================================
    // 2. Conversion Rule Set (版本化規則集)
    // ============================================

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cmm_rule_sets (
        version VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_current BOOLEAN DEFAULT false,
        effective_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        effective_to TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cmm_conversion_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rule_set_version VARCHAR(50) NOT NULL REFERENCES cmm_rule_sets(version),
        rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('UNIT', 'DENSITY', 'ASSEMBLY', 'WASTE', 'PACKAGING', 'SCENARIO')),
        category_l1 VARCHAR(20) REFERENCES cmm_category_l1(code),
        category_l2 VARCHAR(50) REFERENCES cmm_category_l2(code),
        category_l3 VARCHAR(50) REFERENCES cmm_category_l3(code),
        source_material VARCHAR(50),
        target_material VARCHAR(50),
        formula TEXT NOT NULL,
        variables JSONB,
        output_unit VARCHAR(20),
        priority INTEGER DEFAULT 0,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ============================================
    // 3. Calculation Runs (計算執行記錄)
    // ============================================

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cmm_calculation_runs (
        run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID,
        category_l1 VARCHAR(20) NOT NULL REFERENCES cmm_category_l1(code),
        rule_set_version VARCHAR(50) NOT NULL REFERENCES cmm_rule_sets(version),
        input_snapshot JSONB NOT NULL,
        input_hash VARCHAR(64) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED')),
        result_summary JSONB,
        error_log JSONB,
        duration_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_cmm_runs_project ON cmm_calculation_runs(project_id);
      CREATE INDEX idx_cmm_runs_status ON cmm_calculation_runs(status);
      CREATE INDEX idx_cmm_runs_created ON cmm_calculation_runs(created_at DESC);
    `);

    // ============================================
    // 4. Material Breakdown Lines (材料分解結果)
    // ============================================

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cmm_material_breakdown (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID NOT NULL REFERENCES cmm_calculation_runs(run_id) ON DELETE CASCADE,
        source_work_item_code VARCHAR(50),
        category_l1 VARCHAR(20) REFERENCES cmm_category_l1(code),
        category_l2 VARCHAR(50) REFERENCES cmm_category_l2(code),
        category_l3 VARCHAR(50) REFERENCES cmm_category_l3(code),
        material_code VARCHAR(50),
        material_name VARCHAR(100) NOT NULL,
        spec VARCHAR(100),
        base_quantity DECIMAL(15,4) NOT NULL,
        waste_factor DECIMAL(5,4) DEFAULT 0,
        final_quantity DECIMAL(15,4) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        packaging_unit VARCHAR(20),
        packaging_quantity INTEGER,
        unit_price DECIMAL(15,2),
        subtotal DECIMAL(15,2),
        trace_info JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_cmm_breakdown_run ON cmm_material_breakdown(run_id);
    `);

    // ============================================
    // 5. Waste Factor Configuration
    // ============================================

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cmm_waste_factors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rule_set_version VARCHAR(50) NOT NULL REFERENCES cmm_rule_sets(version),
        category_l1 VARCHAR(20) REFERENCES cmm_category_l1(code),
        category_l2 VARCHAR(50) REFERENCES cmm_category_l2(code),
        material_code VARCHAR(50),
        factor DECIMAL(5,4) NOT NULL,
        scenario VARCHAR(50),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ============================================
    // 6. Extend existing cmm_building_profiles
    // ============================================

    await queryRunner.query(`
      ALTER TABLE cmm_building_profiles 
      ADD COLUMN IF NOT EXISTS category_l1 VARCHAR(20) DEFAULT 'CONSTRUCTION',
      ADD COLUMN IF NOT EXISTS category_l2 VARCHAR(50);
    `);

    await queryRunner.query(`
      ALTER TABLE cmm_material_masters
      ADD COLUMN IF NOT EXISTS category_l1 VARCHAR(20),
      ADD COLUMN IF NOT EXISTS category_l2 VARCHAR(50),
      ADD COLUMN IF NOT EXISTS default_waste_factor DECIMAL(5,4) DEFAULT 0;
    `);

    // ============================================
    // 7. Seed Initial Taxonomy Data
    // ============================================

    // Level 1
    await queryRunner.query(`
      INSERT INTO cmm_category_l1 (code, name, description, sort_order) VALUES
        ('CONSTRUCTION', '營建', '結構性工程，包含土建、結構、基礎設施', 1),
        ('INTERIOR', '裝潢', '裝修性工程，包含室內裝修、裝飾', 2)
      ON CONFLICT (code) DO NOTHING;
    `);

    // Level 2 - Construction
    await queryRunner.query(`
      INSERT INTO cmm_category_l2 (code, name, l1_code, default_unit, sort_order) VALUES
        ('CON_EXCAV', '土方開挖', 'CONSTRUCTION', 'm³', 1),
        ('CON_FORM', '模板', 'CONSTRUCTION', 'm²', 2),
        ('CON_REBAR', '鋼筋', 'CONSTRUCTION', 'kg', 3),
        ('CON_CONC', '混凝土', 'CONSTRUCTION', 'm³', 4),
        ('CON_MASON', '泥作', 'CONSTRUCTION', 'm²', 5),
        ('CON_WATER', '防水', 'CONSTRUCTION', 'm²', 6),
        ('CON_STEEL', '鋼構', 'CONSTRUCTION', 'kg', 7)
      ON CONFLICT (code) DO NOTHING;
    `);

    // Level 2 - Interior
    await queryRunner.query(`
      INSERT INTO cmm_category_l2 (code, name, l1_code, default_unit, sort_order) VALUES
        ('INT_PAINT', '油漆塗裝', 'INTERIOR', 'm²', 1),
        ('INT_WOOD', '木作', 'INTERIOR', 'm²', 2),
        ('INT_TILE', '磁磚', 'INTERIOR', 'm²', 3),
        ('INT_CEIL', '天花板', 'INTERIOR', 'm²', 4),
        ('INT_FLOOR', '地坪', 'INTERIOR', 'm²', 5),
        ('INT_CABT', '系統櫃', 'INTERIOR', '尺', 6),
        ('INT_GLASS', '玻璃', 'INTERIOR', '才', 7),
        ('INT_DOOR', '門窗', 'INTERIOR', '樘', 8)
      ON CONFLICT (code) DO NOTHING;
    `);

    // Common categories (mappped to both)
    await queryRunner.query(`
      INSERT INTO cmm_category_l2 (code, name, l1_code, default_unit, sort_order) VALUES
        ('COM_ELEC', '電氣', 'CONSTRUCTION', '點', 10),
        ('COM_PLUMB', '給排水', 'CONSTRUCTION', '點', 11)
      ON CONFLICT (code) DO NOTHING;
    `);

    // Level 3 - Sample work item templates
    await queryRunner.query(`
      INSERT INTO cmm_category_l3 (code, name, l2_code, default_materials, sort_order) VALUES
        ('CON_CONC_SLAB', '樓版澆置', 'CON_CONC', '["混凝土", "鋼筋", "模板"]', 1),
        ('CON_CONC_BEAM', '梁澆置', 'CON_CONC', '["混凝土", "鋼筋", "模板"]', 2),
        ('CON_CONC_COLUMN', '柱澆置', 'CON_CONC', '["混凝土", "鋼筋", "模板"]', 3),
        ('INT_PAINT_LATEX', '乳膠漆', 'INT_PAINT', '["乳膠漆", "批土", "底漆"]', 1),
        ('INT_PAINT_WATER', '防水漆', 'INT_PAINT', '["防水漆", "底漆"]', 2),
        ('INT_TILE_WALL', '壁磚', 'INT_TILE', '["磁磚", "黏著劑", "填縫劑"]', 1),
        ('INT_TILE_FLOOR', '地磚', 'INT_TILE', '["磁磚", "黏著劑", "填縫劑"]', 2)
      ON CONFLICT (code) DO NOTHING;
    `);

    // Initial Rule Set
    await queryRunner.query(`
      INSERT INTO cmm_rule_sets (version, name, description, is_current, effective_from) VALUES
        ('v1.0.0', '初始規則集', '系統初始建立的換算規則', true, CURRENT_TIMESTAMP)
      ON CONFLICT (version) DO NOTHING;
    `);

    // Sample waste factors
    await queryRunner.query(`
      INSERT INTO cmm_waste_factors (rule_set_version, category_l2, factor, description) VALUES
        ('v1.0.0', 'CON_REBAR', 0.03, '鋼筋損耗 3%'),
        ('v1.0.0', 'CON_CONC', 0.03, '混凝土損耗 3%'),
        ('v1.0.0', 'INT_TILE', 0.10, '磁磚損耗 10%'),
        ('v1.0.0', 'INT_PAINT', 0.05, '油漆損耗 5%'),
        ('v1.0.0', 'INT_WOOD', 0.08, '木作損耗 8%')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS cmm_waste_factors CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS cmm_material_breakdown CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS cmm_calculation_runs CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS cmm_conversion_rules CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS cmm_rule_sets CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS cmm_category_l3 CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS cmm_category_l2 CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS cmm_category_l1 CASCADE;`);

    await queryRunner.query(`
      ALTER TABLE cmm_building_profiles 
      DROP COLUMN IF EXISTS category_l1,
      DROP COLUMN IF EXISTS category_l2;
    `);

    await queryRunner.query(`
      ALTER TABLE cmm_material_masters
      DROP COLUMN IF EXISTS category_l1,
      DROP COLUMN IF EXISTS category_l2,
      DROP COLUMN IF EXISTS default_waste_factor;
    `);
  }
}
