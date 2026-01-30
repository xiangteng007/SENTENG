import { DataSource } from 'typeorm';
import { CmmCategoryL1 } from '../modules/cmm/entities/cmm-category-l1.entity';
import { CmmCategoryL2 } from '../modules/cmm/entities/cmm-category-l2.entity';
import { CmmCategoryL3 } from '../modules/cmm/entities/cmm-category-l3.entity';
import { CmmRuleSet } from '../modules/cmm/entities/cmm-rule-set.entity';
import { CmmConversionRule, RuleType } from '../modules/cmm/entities/cmm-conversion-rule.entity';

export const seedCmmTaxonomy = async (dataSource: DataSource) => {
  const l1Repo = dataSource.getRepository(CmmCategoryL1);
  const l2Repo = dataSource.getRepository(CmmCategoryL2);
  const l3Repo = dataSource.getRepository(CmmCategoryL3);
  const ruleSetRepo = dataSource.getRepository(CmmRuleSet);
  const ruleRepo = dataSource.getRepository(CmmConversionRule);

  // Check if already seeded
  const existingL1 = await l1Repo.count();
  if (existingL1 > 0) {
    console.log('CMM taxonomy already seeded, skipping...');
    return;
  }

  console.log('Seeding CMM taxonomy...');

  // ===== L1 Categories =====
  const l1Data = [
    {
      code: 'CON',
      name: '營建工程',
      description: '建築結構、土木工程',
      sortOrder: 1,
    },
    {
      code: 'INT',
      name: '室內裝潢',
      description: '室內裝修、裝飾工程',
      sortOrder: 2,
    },
  ];

  for (const l1 of l1Data) {
    await l1Repo.save(l1Repo.create(l1));
  }

  // ===== L2 Categories =====
  const l2Data = [
    // 營建工程 L2
    {
      code: 'CON_REBAR',
      name: '鋼筋工程',
      l1Code: 'CON',
      defaultUnit: 'kg',
      sortOrder: 1,
    },
    {
      code: 'CON_CONC',
      name: '混凝土工程',
      l1Code: 'CON',
      defaultUnit: 'm3',
      sortOrder: 2,
    },
    {
      code: 'CON_FORM',
      name: '模板工程',
      l1Code: 'CON',
      defaultUnit: 'm2',
      sortOrder: 3,
    },
    {
      code: 'CON_STEEL',
      name: '鋼構工程',
      l1Code: 'CON',
      defaultUnit: 'kg',
      sortOrder: 4,
    },
    {
      code: 'CON_MASONRY',
      name: '砌磚工程',
      l1Code: 'CON',
      defaultUnit: 'm2',
      sortOrder: 5,
    },
    // 室內裝潢 L2
    {
      code: 'INT_TILE',
      name: '磁磚工程',
      l1Code: 'INT',
      defaultUnit: 'm2',
      sortOrder: 1,
    },
    {
      code: 'INT_PAINT',
      name: '油漆工程',
      l1Code: 'INT',
      defaultUnit: 'm2',
      sortOrder: 2,
    },
    {
      code: 'INT_WOOD',
      name: '木作工程',
      l1Code: 'INT',
      defaultUnit: 'm2',
      sortOrder: 3,
    },
    {
      code: 'INT_FLOOR',
      name: '地板工程',
      l1Code: 'INT',
      defaultUnit: 'm2',
      sortOrder: 4,
    },
    {
      code: 'INT_CEILING',
      name: '天花板工程',
      l1Code: 'INT',
      defaultUnit: 'm2',
      sortOrder: 5,
    },
  ];

  for (const l2 of l2Data) {
    await l2Repo.save(l2Repo.create(l2));
  }

  // ===== L3 Categories =====
  const l3Data = [
    // 鋼筋工程 L3
    {
      code: 'CON_REBAR_D10',
      name: 'D10 鋼筋',
      l2Code: 'CON_REBAR',
      defaultMaterials: ['REBAR_D10'],
      sortOrder: 1,
    },
    {
      code: 'CON_REBAR_D13',
      name: 'D13 鋼筋',
      l2Code: 'CON_REBAR',
      defaultMaterials: ['REBAR_D13'],
      sortOrder: 2,
    },
    {
      code: 'CON_REBAR_D16',
      name: 'D16 鋼筋',
      l2Code: 'CON_REBAR',
      defaultMaterials: ['REBAR_D16'],
      sortOrder: 3,
    },
    {
      code: 'CON_REBAR_D19',
      name: 'D19 鋼筋',
      l2Code: 'CON_REBAR',
      defaultMaterials: ['REBAR_D19'],
      sortOrder: 4,
    },
    {
      code: 'CON_REBAR_D22',
      name: 'D22 鋼筋',
      l2Code: 'CON_REBAR',
      defaultMaterials: ['REBAR_D22'],
      sortOrder: 5,
    },
    {
      code: 'CON_REBAR_D25',
      name: 'D25 鋼筋',
      l2Code: 'CON_REBAR',
      defaultMaterials: ['REBAR_D25'],
      sortOrder: 6,
    },
    // 混凝土工程 L3
    {
      code: 'CON_CONC_140',
      name: '140kgf 混凝土',
      l2Code: 'CON_CONC',
      defaultMaterials: ['CONC_140'],
      sortOrder: 1,
    },
    {
      code: 'CON_CONC_175',
      name: '175kgf 混凝土',
      l2Code: 'CON_CONC',
      defaultMaterials: ['CONC_175'],
      sortOrder: 2,
    },
    {
      code: 'CON_CONC_210',
      name: '210kgf 混凝土',
      l2Code: 'CON_CONC',
      defaultMaterials: ['CONC_210'],
      sortOrder: 3,
    },
    {
      code: 'CON_CONC_280',
      name: '280kgf 混凝土',
      l2Code: 'CON_CONC',
      defaultMaterials: ['CONC_280'],
      sortOrder: 4,
    },
    {
      code: 'CON_CONC_350',
      name: '350kgf 混凝土',
      l2Code: 'CON_CONC',
      defaultMaterials: ['CONC_350'],
      sortOrder: 5,
    },
    // 模板工程 L3
    {
      code: 'CON_FORM_SLAB',
      name: '樓板模板',
      l2Code: 'CON_FORM',
      defaultMaterials: ['FORM_PLYWOOD'],
      sortOrder: 1,
    },
    {
      code: 'CON_FORM_BEAM',
      name: '梁模板',
      l2Code: 'CON_FORM',
      defaultMaterials: ['FORM_PLYWOOD'],
      sortOrder: 2,
    },
    {
      code: 'CON_FORM_COL',
      name: '柱模板',
      l2Code: 'CON_FORM',
      defaultMaterials: ['FORM_PLYWOOD'],
      sortOrder: 3,
    },
    {
      code: 'CON_FORM_WALL',
      name: '牆模板',
      l2Code: 'CON_FORM',
      defaultMaterials: ['FORM_PLYWOOD'],
      sortOrder: 4,
    },
    // 磁磚工程 L3
    {
      code: 'INT_TILE_FLOOR',
      name: '地磚',
      l2Code: 'INT_TILE',
      defaultMaterials: ['TILE_60X60'],
      sortOrder: 1,
    },
    {
      code: 'INT_TILE_WALL',
      name: '壁磚',
      l2Code: 'INT_TILE',
      defaultMaterials: ['TILE_30X60'],
      sortOrder: 2,
    },
    {
      code: 'INT_TILE_BATH',
      name: '浴室磁磚',
      l2Code: 'INT_TILE',
      defaultMaterials: ['TILE_30X30'],
      sortOrder: 3,
    },
    // 油漆工程 L3
    {
      code: 'INT_PAINT_LATEX',
      name: '乳膠漆',
      l2Code: 'INT_PAINT',
      defaultMaterials: ['PAINT_LATEX'],
      sortOrder: 1,
    },
    {
      code: 'INT_PAINT_ENAMEL',
      name: '油性漆',
      l2Code: 'INT_PAINT',
      defaultMaterials: ['PAINT_ENAMEL'],
      sortOrder: 2,
    },
    {
      code: 'INT_PAINT_WATER',
      name: '水泥漆',
      l2Code: 'INT_PAINT',
      defaultMaterials: ['PAINT_CEMENT'],
      sortOrder: 3,
    },
    // 木作工程 L3
    {
      code: 'INT_WOOD_CABINET',
      name: '系統櫃',
      l2Code: 'INT_WOOD',
      defaultMaterials: ['WOOD_BOARD'],
      sortOrder: 1,
    },
    {
      code: 'INT_WOOD_DOOR',
      name: '木門',
      l2Code: 'INT_WOOD',
      defaultMaterials: ['WOOD_DOOR'],
      sortOrder: 2,
    },
    {
      code: 'INT_WOOD_TRIM',
      name: '木作收邊',
      l2Code: 'INT_WOOD',
      defaultMaterials: ['WOOD_TRIM'],
      sortOrder: 3,
    },
  ];

  for (const l3 of l3Data) {
    await l3Repo.save(l3Repo.create(l3));
  }

  // ===== Rule Set =====
  const ruleSet = ruleSetRepo.create({
    version: 'v1.0.0',
    name: '基礎計算規則集',
    description: '包含營建與裝潢基本物料轉換規則',
    isCurrent: true,
    effectiveFrom: new Date('2025-01-01'),
  });
  await ruleSetRepo.save(ruleSet);

  // ===== Conversion Rules =====
  const rules = [
    // 鋼筋損耗
    {
      ruleSetVersion: 'v1.0.0',
      ruleType: RuleType.WASTE,
      categoryL1: 'CON',
      categoryL2: 'CON_REBAR',
      formula: 'quantity * 1.05',
      description: '鋼筋損耗 5%',
      priority: 1,
    },
    // 混凝土損耗
    {
      ruleSetVersion: 'v1.0.0',
      ruleType: RuleType.WASTE,
      categoryL1: 'CON',
      categoryL2: 'CON_CONC',
      formula: 'quantity * 1.03',
      description: '混凝土損耗 3%',
      priority: 1,
    },
    // 模板損耗
    {
      ruleSetVersion: 'v1.0.0',
      ruleType: RuleType.WASTE,
      categoryL1: 'CON',
      categoryL2: 'CON_FORM',
      formula: 'quantity * 1.15',
      description: '模板損耗 15%',
      priority: 1,
    },
    // 磁磚損耗
    {
      ruleSetVersion: 'v1.0.0',
      ruleType: RuleType.WASTE,
      categoryL1: 'INT',
      categoryL2: 'INT_TILE',
      formula: 'quantity * 1.10',
      description: '磁磚損耗 10%',
      priority: 1,
    },
    // 油漆損耗
    {
      ruleSetVersion: 'v1.0.0',
      ruleType: RuleType.WASTE,
      categoryL1: 'INT',
      categoryL2: 'INT_PAINT',
      formula: 'quantity * 1.08',
      description: '油漆損耗 8%',
      priority: 1,
    },
    // 木作損耗
    {
      ruleSetVersion: 'v1.0.0',
      ruleType: RuleType.WASTE,
      categoryL1: 'INT',
      categoryL2: 'INT_WOOD',
      formula: 'quantity * 1.12',
      description: '木作損耗 12%',
      priority: 1,
    },
  ];

  for (const rule of rules) {
    await ruleRepo.save(ruleRepo.create(rule));
  }

  console.log('CMM taxonomy seeded successfully!');
};
