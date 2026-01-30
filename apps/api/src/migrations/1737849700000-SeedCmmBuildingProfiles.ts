import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CMM Seed Data: Building Profiles
 * 預設的建築參數係數
 */
export class SeedCmmBuildingProfiles1737849700000 implements MigrationInterface {
  name = 'SeedCmmBuildingProfiles1737849700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // RC 結構參數
    await queryRunner.query(`
            INSERT INTO "cmm_building_profiles" 
            ("code", "name", "structure_type", "building_usage", "min_floors", "max_floors",
             "rebar_factor", "rebar_unit", "concrete_factor", "concrete_unit", 
             "formwork_factor", "formwork_unit", "mortar_factor", "mortar_unit",
             "is_system_default", "description")
            VALUES 
            -- RC 住宅 (7F 以下)
            ('RC_RESIDENTIAL_LOW', 'RC住宅 (7F以下)', 'RC', 'RESIDENTIAL', 1, 7,
             120.0, 'kg/m²', 0.45, 'm³/m²', 2.8, 'm²/m²', 0.02, 'm³/m²',
             true, '7層以下RC住宅標準係數'),
             
            -- RC 住宅 (8-14F)
            ('RC_RESIDENTIAL_MID', 'RC住宅 (8-14F)', 'RC', 'RESIDENTIAL', 8, 14,
             140.0, 'kg/m²', 0.50, 'm³/m²', 3.0, 'm²/m²', 0.025, 'm³/m²',
             true, '8-14層RC住宅標準係數'),
             
            -- RC 住宅 (15F 以上)
            ('RC_RESIDENTIAL_HIGH', 'RC住宅 (15F以上)', 'RC', 'RESIDENTIAL', 15, NULL,
             160.0, 'kg/m²', 0.55, 'm³/m²', 3.2, 'm²/m²', 0.03, 'm³/m²',
             true, '15層以上RC住宅標準係數'),
             
            -- RC 辦公
            ('RC_OFFICE', 'RC辦公大樓', 'RC', 'OFFICE', 1, NULL,
             130.0, 'kg/m²', 0.48, 'm³/m²', 2.9, 'm²/m²', 0.02, 'm³/m²',
             true, 'RC辦公大樓標準係數'),
             
            -- RC 商業
            ('RC_COMMERCIAL', 'RC商業建築', 'RC', 'COMMERCIAL', 1, NULL,
             125.0, 'kg/m²', 0.46, 'm³/m²', 2.85, 'm²/m²', 0.022, 'm³/m²',
             true, 'RC商業建築標準係數')
        `);

    // SRC 結構參數
    await queryRunner.query(`
            INSERT INTO "cmm_building_profiles" 
            ("code", "name", "structure_type", "building_usage", "min_floors", "max_floors",
             "rebar_factor", "rebar_unit", "concrete_factor", "concrete_unit", 
             "formwork_factor", "formwork_unit", "steel_factor", "steel_unit",
             "mortar_factor", "mortar_unit", "is_system_default", "description")
            VALUES 
            -- SRC 住宅
            ('SRC_RESIDENTIAL', 'SRC住宅', 'SRC', 'RESIDENTIAL', 1, NULL,
             100.0, 'kg/m²', 0.40, 'm³/m²', 2.5, 'm²/m²', 60.0, 'kg/m²', 0.02, 'm³/m²',
             true, 'SRC住宅標準係數'),
             
            -- SRC 辦公
            ('SRC_OFFICE', 'SRC辦公大樓', 'SRC', 'OFFICE', 1, NULL,
             95.0, 'kg/m²', 0.38, 'm³/m²', 2.4, 'm²/m²', 65.0, 'kg/m²', 0.018, 'm³/m²',
             true, 'SRC辦公大樓標準係數')
        `);

    // SC 結構參數
    await queryRunner.query(`
            INSERT INTO "cmm_building_profiles" 
            ("code", "name", "structure_type", "building_usage", "min_floors", "max_floors",
             "rebar_factor", "rebar_unit", "concrete_factor", "concrete_unit", 
             "formwork_factor", "formwork_unit", "steel_factor", "steel_unit",
             "is_system_default", "description")
            VALUES 
            -- SC 工業廠房
            ('SC_INDUSTRIAL', 'SC工業廠房', 'SC', 'INDUSTRIAL', 1, 3,
             20.0, 'kg/m²', 0.15, 'm³/m²', 0.5, 'm²/m²', 80.0, 'kg/m²',
             true, 'SC工業廠房標準係數')
        `);

    // 常用物料主檔 Seed
    await queryRunner.query(`
            INSERT INTO "cmm_material_masters"
            ("code", "name", "category", "base_unit", "specification",
             "standard_weight_per_length", "usage_factor_rc", "usage_factor_src", "usage_factor_sc",
             "status", "tags")
            VALUES
            -- 鋼筋
            ('REBAR-D10', '竹節鋼筋 #3 (D10)', 'REBAR', 'kg', 'SD420W D10mm', 0.560, 120.0, 100.0, 20.0, 'ACTIVE', ARRAY['鋼筋', '主筋']),
            ('REBAR-D13', '竹節鋼筋 #4 (D13)', 'REBAR', 'kg', 'SD420W D13mm', 0.995, 120.0, 100.0, 20.0, 'ACTIVE', ARRAY['鋼筋', '主筋']),
            ('REBAR-D16', '竹節鋼筋 #5 (D16)', 'REBAR', 'kg', 'SD420W D16mm', 1.560, 120.0, 100.0, 20.0, 'ACTIVE', ARRAY['鋼筋', '主筋']),
            ('REBAR-D19', '竹節鋼筋 #6 (D19)', 'REBAR', 'kg', 'SD420W D19mm', 2.250, 120.0, 100.0, 20.0, 'ACTIVE', ARRAY['鋼筋', '主筋']),
            ('REBAR-D22', '竹節鋼筋 #7 (D22)', 'REBAR', 'kg', 'SD420W D22mm', 3.040, 120.0, 100.0, 20.0, 'ACTIVE', ARRAY['鋼筋', '主筋']),
            ('REBAR-D25', '竹節鋼筋 #8 (D25)', 'REBAR', 'kg', 'SD420W D25mm', 3.980, 120.0, 100.0, 20.0, 'ACTIVE', ARRAY['鋼筋', '主筋']),
            
            -- 混凝土
            ('CONC-3000', '混凝土 3000psi', 'CONCRETE', 'm³', 'fc''=210 kg/cm² (3000psi)', NULL, 0.45, 0.40, 0.15, 'ACTIVE', ARRAY['混凝土', '結構']),
            ('CONC-4000', '混凝土 4000psi', 'CONCRETE', 'm³', 'fc''=280 kg/cm² (4000psi)', NULL, 0.45, 0.40, 0.15, 'ACTIVE', ARRAY['混凝土', '結構']),
            ('CONC-5000', '混凝土 5000psi', 'CONCRETE', 'm³', 'fc''=350 kg/cm² (5000psi)', NULL, 0.45, 0.40, 0.15, 'ACTIVE', ARRAY['混凝土', '結構']),
            
            -- 模板
            ('FORM-PLYWOOD', '合板模板', 'FORMWORK', 'm²', '厚度 18mm 合板', NULL, 2.8, 2.5, 0.5, 'ACTIVE', ARRAY['模板', '結構']),
            ('FORM-STEEL', '鋼模板', 'FORMWORK', 'm²', '系統鋼模', NULL, 2.8, 2.5, 0.5, 'ACTIVE', ARRAY['模板', '結構']),
            
            -- 水泥砂漿
            ('MORTAR-1-3', '水泥砂漿 1:3', 'MORTAR', 'm³', '水泥:砂 = 1:3', NULL, 0.02, 0.02, NULL, 'ACTIVE', ARRAY['砂漿', '粉刷'])
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "cmm_material_masters" WHERE code LIKE 'REBAR-%' OR code LIKE 'CONC-%' OR code LIKE 'FORM-%' OR code LIKE 'MORTAR-%'`
    );
    await queryRunner.query(`DELETE FROM "cmm_building_profiles" WHERE is_system_default = true`);
  }
}
