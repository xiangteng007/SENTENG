/**
 * CMM Seed Script - 物料估算系統初始資料
 *
 * 執行方式: npm run seed:cmm
 *
 * 資料來源: 台灣營建業界標準
 * - 公共工程委員會
 * - 高雄結構技師公會
 * - 交大結構實驗室
 */

import { DataSource } from "typeorm";
import {
  CmmBuildingProfile,
  StructureType,
  BuildingUsage,
} from "./cmm-building-profile.entity";
import {
  CmmMaterialMaster,
  MaterialCategory,
  MaterialStatus,
} from "./cmm-material-master.entity";
import {
  CmmCategoryL1,
  CategoryLevel1,
} from "./entities/cmm-category-l1.entity";
import { CmmCategoryL2 } from "./entities/cmm-category-l2.entity";
import { CmmRuleSet } from "./entities/cmm-rule-set.entity";

// ==================== Building Profiles ====================
// 單位：鋼筋 kg/m², 混凝土 m³/m², 模板 m²/m²
// 業界經驗值：鋼筋 330-400 kg/坪, 混凝土 2.4-3.0 m³/坪, 模板 3.0-4.0倍樓地板面積

const BUILDING_PROFILES: Partial<CmmBuildingProfile>[] = [
  // RC 鋼筋混凝土結構
  {
    code: "RC_2_3F",
    name: "RC透天 (2-3F)",
    structureType: StructureType.RC,
    buildingUsage: BuildingUsage.RESIDENTIAL,
    minFloors: 2,
    maxFloors: 3,
    rebarFactor: 100,
    rebarUnit: "kg/m²",
    concreteFactor: 0.73,
    concreteUnit: "m³/m²",
    formworkFactor: 3.0,
    formworkUnit: "m²/m²",
    mortarFactor: 0.18,
    mortarUnit: "m³/m²",
    isSystemDefault: true,
    description: "RC透天2-3樓住宅，適用於一般透天厝",
  },
  {
    code: "RC_4_5F",
    name: "RC透天 (4-5F)",
    structureType: StructureType.RC,
    buildingUsage: BuildingUsage.RESIDENTIAL,
    minFloors: 4,
    maxFloors: 5,
    rebarFactor: 112,
    rebarUnit: "kg/m²",
    concreteFactor: 0.79,
    concreteUnit: "m³/m²",
    formworkFactor: 3.2,
    formworkUnit: "m²/m²",
    mortarFactor: 0.2,
    mortarUnit: "m³/m²",
    isSystemDefault: true,
    description: "RC透天4-5樓住宅",
  },
  {
    code: "RC_VILLA",
    name: "別墅 (RC)",
    structureType: StructureType.RC,
    buildingUsage: BuildingUsage.RESIDENTIAL,
    minFloors: 1,
    maxFloors: 4,
    rebarFactor: 106,
    rebarUnit: "kg/m²",
    concreteFactor: 0.76,
    concreteUnit: "m³/m²",
    formworkFactor: 3.0,
    formworkUnit: "m²/m²",
    mortarFactor: 0.18,
    mortarUnit: "m³/m²",
    isSystemDefault: true,
    description: "RC別墅住宅",
  },
  {
    code: "RC_APT_5_6F",
    name: "公寓 (5-6F)",
    structureType: StructureType.RC,
    buildingUsage: BuildingUsage.RESIDENTIAL,
    minFloors: 5,
    maxFloors: 6,
    rebarFactor: 109,
    rebarUnit: "kg/m²",
    concreteFactor: 0.79,
    concreteUnit: "m³/m²",
    formworkFactor: 3.3,
    formworkUnit: "m²/m²",
    mortarFactor: 0.2,
    mortarUnit: "m³/m²",
    isSystemDefault: true,
    description: "RC公寓5-6樓",
  },
  {
    code: "RC_BLDG_7_12F",
    name: "大樓 (7-12F)",
    structureType: StructureType.RC,
    buildingUsage: BuildingUsage.RESIDENTIAL,
    minFloors: 7,
    maxFloors: 12,
    rebarFactor: 112,
    rebarUnit: "kg/m²",
    concreteFactor: 0.82,
    concreteUnit: "m³/m²",
    formworkFactor: 3.4,
    formworkUnit: "m²/m²",
    mortarFactor: 0.22,
    mortarUnit: "m³/m²",
    isSystemDefault: true,
    description: "RC大樓7-12樓",
  },
  {
    code: "RC_HIGH_13_20F",
    name: "高層 (13-20F)",
    structureType: StructureType.RC,
    buildingUsage: BuildingUsage.RESIDENTIAL,
    minFloors: 13,
    maxFloors: 20,
    rebarFactor: 115,
    rebarUnit: "kg/m²",
    concreteFactor: 0.85,
    concreteUnit: "m³/m²",
    formworkFactor: 3.5,
    formworkUnit: "m²/m²",
    mortarFactor: 0.24,
    mortarUnit: "m³/m²",
    isSystemDefault: true,
    description: "RC高層13-20樓",
  },
  {
    code: "RC_HIGH_21_30F",
    name: "高層 (21-30F)",
    structureType: StructureType.RC,
    buildingUsage: BuildingUsage.RESIDENTIAL,
    minFloors: 21,
    maxFloors: 30,
    rebarFactor: 121,
    rebarUnit: "kg/m²",
    concreteFactor: 0.91,
    concreteUnit: "m³/m²",
    formworkFactor: 3.6,
    formworkUnit: "m²/m²",
    mortarFactor: 0.26,
    mortarUnit: "m³/m²",
    isSystemDefault: true,
    description: "RC高層21-30樓",
  },
  {
    code: "SRC_SUPER_HIGH",
    name: "超高層 (30F+)",
    structureType: StructureType.SRC,
    buildingUsage: BuildingUsage.RESIDENTIAL,
    minFloors: 31,
    maxFloors: undefined,
    rebarFactor: 130,
    rebarUnit: "kg/m²",
    concreteFactor: 0.95,
    concreteUnit: "m³/m²",
    formworkFactor: 3.8,
    formworkUnit: "m²/m²",
    steelFactor: 80,
    steelUnit: "kg/m²",
    mortarFactor: 0.28,
    mortarUnit: "m³/m²",
    isSystemDefault: true,
    description: "SRC超高層30樓以上",
  },
  {
    code: "RC_OFFICE",
    name: "辦公大樓",
    structureType: StructureType.RC,
    buildingUsage: BuildingUsage.OFFICE,
    minFloors: 7,
    maxFloors: 20,
    rebarFactor: 115,
    rebarUnit: "kg/m²",
    concreteFactor: 0.85,
    concreteUnit: "m³/m²",
    formworkFactor: 3.5,
    formworkUnit: "m²/m²",
    mortarFactor: 0.24,
    mortarUnit: "m³/m²",
    isSystemDefault: true,
    description: "RC/SRC辦公大樓",
  },
  {
    code: "SC_FACTORY",
    name: "工業廠房 (SC)",
    structureType: StructureType.SC,
    buildingUsage: BuildingUsage.INDUSTRIAL,
    minFloors: 1,
    maxFloors: 3,
    rebarFactor: 45,
    rebarUnit: "kg/m²",
    concreteFactor: 0.35,
    concreteUnit: "m³/m²",
    formworkFactor: 2.0,
    formworkUnit: "m²/m²",
    steelFactor: 120,
    steelUnit: "kg/m²",
    mortarFactor: 0.12,
    mortarUnit: "m³/m²",
    isSystemDefault: true,
    description: "SC鋼構工業廠房",
  },
  {
    code: "RC_BASEMENT",
    name: "地下室 (每層)",
    structureType: StructureType.RC,
    buildingUsage: BuildingUsage.MIXED,
    minFloors: 1,
    maxFloors: 5,
    rebarFactor: 145,
    rebarUnit: "kg/m²",
    concreteFactor: 1.1,
    concreteUnit: "m³/m²",
    formworkFactor: 4.0,
    formworkUnit: "m²/m²",
    mortarFactor: 0.3,
    mortarUnit: "m³/m²",
    isSystemDefault: true,
    description: "RC地下室每層用量",
  },
  {
    code: "RB_3F",
    name: "透天厝 (RB 3F)",
    structureType: StructureType.RB,
    buildingUsage: BuildingUsage.RESIDENTIAL,
    minFloors: 1,
    maxFloors: 3,
    rebarFactor: 55,
    rebarUnit: "kg/m²",
    concreteFactor: 0.45,
    concreteUnit: "m³/m²",
    formworkFactor: 2.2,
    formworkUnit: "m²/m²",
    mortarFactor: 0.25,
    mortarUnit: "m³/m²",
    isSystemDefault: true,
    description: "RB加強磚造透天厝",
  },
  {
    code: "RB_WAREHOUSE",
    name: "農舍/倉庫 (RB)",
    structureType: StructureType.RB,
    buildingUsage: BuildingUsage.INDUSTRIAL,
    minFloors: 1,
    maxFloors: 2,
    rebarFactor: 45,
    rebarUnit: "kg/m²",
    concreteFactor: 0.38,
    concreteUnit: "m³/m²",
    formworkFactor: 1.8,
    formworkUnit: "m²/m²",
    mortarFactor: 0.22,
    mortarUnit: "m³/m²",
    isSystemDefault: true,
    description: "RB加強磚造農舍/倉庫",
  },
];

// ==================== Materials ====================
// 鋼筋規格依據 CNS 560 SD420W

const MATERIALS: Partial<CmmMaterialMaster>[] = [
  // 鋼筋
  {
    code: "REBAR_D10",
    name: "#3 D10 鋼筋",
    englishName: "Rebar #3 D10",
    category: MaterialCategory.REBAR,
    subCategory: "竹節鋼筋",
    baseUnit: "kg",
    specification: "D10 (9.53mm) SD420W",
    standardWeightPerLength: 0.56,
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "REBAR_D13",
    name: "#4 D13 鋼筋",
    englishName: "Rebar #4 D13",
    category: MaterialCategory.REBAR,
    subCategory: "竹節鋼筋",
    baseUnit: "kg",
    specification: "D13 (12.7mm) SD420W",
    standardWeightPerLength: 0.99,
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "REBAR_D16",
    name: "#5 D16 鋼筋",
    englishName: "Rebar #5 D16",
    category: MaterialCategory.REBAR,
    subCategory: "竹節鋼筋",
    baseUnit: "kg",
    specification: "D16 (15.9mm) SD420W",
    standardWeightPerLength: 1.56,
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "REBAR_D19",
    name: "#6 D19 鋼筋",
    englishName: "Rebar #6 D19",
    category: MaterialCategory.REBAR,
    subCategory: "竹節鋼筋",
    baseUnit: "kg",
    specification: "D19 (19.1mm) SD420W",
    standardWeightPerLength: 2.25,
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "REBAR_D22",
    name: "#7 D22 鋼筋",
    englishName: "Rebar #7 D22",
    category: MaterialCategory.REBAR,
    subCategory: "竹節鋼筋",
    baseUnit: "kg",
    specification: "D22 (22.2mm) SD420W",
    standardWeightPerLength: 3.04,
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "REBAR_D25",
    name: "#8 D25 鋼筋",
    englishName: "Rebar #8 D25",
    category: MaterialCategory.REBAR,
    subCategory: "竹節鋼筋",
    baseUnit: "kg",
    specification: "D25 (25.4mm) SD420W",
    standardWeightPerLength: 3.98,
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "REBAR_D29",
    name: "#9 D29 鋼筋",
    englishName: "Rebar #9 D29",
    category: MaterialCategory.REBAR,
    subCategory: "竹節鋼筋",
    baseUnit: "kg",
    specification: "D29 (28.7mm) SD420W",
    standardWeightPerLength: 5.08,
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "REBAR_D32",
    name: "#10 D32 鋼筋",
    englishName: "Rebar #10 D32",
    category: MaterialCategory.REBAR,
    subCategory: "竹節鋼筋",
    baseUnit: "kg",
    specification: "D32 (32.2mm) SD420W",
    standardWeightPerLength: 6.39,
    status: MaterialStatus.ACTIVE,
  },

  // 混凝土
  {
    code: "CONC_140",
    name: "fc'140 混凝土",
    englishName: "Concrete 2000psi",
    category: MaterialCategory.CONCRETE,
    baseUnit: "m³",
    specification: "fc'140 (2000 psi)",
    density: 2400,
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "CONC_175",
    name: "fc'175 混凝土",
    englishName: "Concrete 2500psi",
    category: MaterialCategory.CONCRETE,
    baseUnit: "m³",
    specification: "fc'175 (2500 psi)",
    density: 2400,
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "CONC_210",
    name: "fc'210 混凝土",
    englishName: "Concrete 3000psi",
    category: MaterialCategory.CONCRETE,
    baseUnit: "m³",
    specification: "fc'210 (3000 psi)",
    density: 2400,
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "CONC_280",
    name: "fc'280 混凝土",
    englishName: "Concrete 4000psi",
    category: MaterialCategory.CONCRETE,
    baseUnit: "m³",
    specification: "fc'280 (4000 psi)",
    density: 2400,
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "CONC_350",
    name: "fc'350 混凝土",
    englishName: "Concrete 5000psi",
    category: MaterialCategory.CONCRETE,
    baseUnit: "m³",
    specification: "fc'350 (5000 psi)",
    density: 2400,
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "CONC_420",
    name: "fc'420 混凝土",
    englishName: "Concrete 6000psi",
    category: MaterialCategory.CONCRETE,
    baseUnit: "m³",
    specification: "fc'420 (6000 psi)",
    density: 2400,
    status: MaterialStatus.ACTIVE,
  },

  // 模板
  {
    code: "FORM_PLYWOOD",
    name: "夾板模板",
    englishName: "Plywood Formwork",
    category: MaterialCategory.FORMWORK,
    baseUnit: "m²",
    specification: "6分夾板 (18mm)",
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "FORM_STEEL",
    name: "鋼模",
    englishName: "Steel Formwork",
    category: MaterialCategory.FORMWORK,
    baseUnit: "m²",
    specification: "組合式鋼模",
    status: MaterialStatus.ACTIVE,
  },

  // 水泥砂
  {
    code: "CEMENT_50KG",
    name: "水泥 50kg",
    englishName: "Cement 50kg Bag",
    category: MaterialCategory.CEMENT,
    baseUnit: "包",
    specification: "普通卜特蘭水泥 50kg裝",
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "SAND_FINE",
    name: "細砂",
    englishName: "Fine Sand",
    category: MaterialCategory.SAND,
    baseUnit: "m³",
    specification: "粉刷用細砂",
    density: 1600,
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "SAND_COARSE",
    name: "粗砂",
    englishName: "Coarse Sand",
    category: MaterialCategory.SAND,
    baseUnit: "m³",
    specification: "混凝土用粗砂",
    density: 1700,
    status: MaterialStatus.ACTIVE,
  },
  {
    code: "GRAVEL",
    name: "碎石",
    englishName: "Gravel",
    category: MaterialCategory.GRAVEL,
    baseUnit: "m³",
    specification: '3/4" 碎石',
    density: 1800,
    status: MaterialStatus.ACTIVE,
  },
];

// ==================== Categories ====================

const CATEGORY_L1: Partial<CmmCategoryL1>[] = [
  {
    code: CategoryLevel1.CONSTRUCTION,
    name: "營建",
    description: "結構體與土木工程",
    sortOrder: 1,
    isActive: true,
  },
  {
    code: CategoryLevel1.INTERIOR,
    name: "裝潢",
    description: "室內裝修工程",
    sortOrder: 2,
    isActive: true,
  },
];

const CATEGORY_L2: Partial<CmmCategoryL2>[] = [
  // 營建
  {
    code: "CON_REBAR",
    l1Code: CategoryLevel1.CONSTRUCTION,
    name: "鋼筋工程",
    defaultUnit: "kg",
    sortOrder: 1,
    isActive: true,
  },
  {
    code: "CON_CONC",
    l1Code: CategoryLevel1.CONSTRUCTION,
    name: "混凝土工程",
    defaultUnit: "m³",
    sortOrder: 2,
    isActive: true,
  },
  {
    code: "CON_FORM",
    l1Code: CategoryLevel1.CONSTRUCTION,
    name: "模板工程",
    defaultUnit: "m²",
    sortOrder: 3,
    isActive: true,
  },
  {
    code: "CON_STEEL",
    l1Code: CategoryLevel1.CONSTRUCTION,
    name: "鋼骨工程",
    defaultUnit: "kg",
    sortOrder: 4,
    isActive: true,
  },
  {
    code: "CON_BRICK",
    l1Code: CategoryLevel1.CONSTRUCTION,
    name: "砌磚工程",
    defaultUnit: "塊",
    sortOrder: 5,
    isActive: true,
  },

  // 裝潢
  {
    code: "INT_TILE",
    l1Code: CategoryLevel1.INTERIOR,
    name: "磁磚工程",
    defaultUnit: "m²",
    sortOrder: 1,
    isActive: true,
  },
  {
    code: "INT_PAINT",
    l1Code: CategoryLevel1.INTERIOR,
    name: "油漆工程",
    defaultUnit: "m²",
    sortOrder: 2,
    isActive: true,
  },
  {
    code: "INT_WOOD",
    l1Code: CategoryLevel1.INTERIOR,
    name: "木作工程",
    defaultUnit: "才",
    sortOrder: 3,
    isActive: true,
  },
  {
    code: "INT_FLOOR",
    l1Code: CategoryLevel1.INTERIOR,
    name: "地板工程",
    defaultUnit: "坪",
    sortOrder: 4,
    isActive: true,
  },
  {
    code: "INT_CEILING",
    l1Code: CategoryLevel1.INTERIOR,
    name: "天花板工程",
    defaultUnit: "坪",
    sortOrder: 5,
    isActive: true,
  },
];

// ==================== Seed Function ====================

export async function seedCmmData(dataSource: DataSource): Promise<void> {
  console.log("🌱 Starting CMM seed...");

  const profileRepo = dataSource.getRepository(CmmBuildingProfile);
  const materialRepo = dataSource.getRepository(CmmMaterialMaster);
  const categoryL1Repo = dataSource.getRepository(CmmCategoryL1);
  const categoryL2Repo = dataSource.getRepository(CmmCategoryL2);
  const ruleSetRepo = dataSource.getRepository(CmmRuleSet);

  // Check if already seeded
  const existingProfiles = await profileRepo.count();
  if (existingProfiles > 0) {
    console.log("⚠️  CMM data already exists, skipping seed.");
    console.log(`   - Building Profiles: ${existingProfiles}`);
    console.log(`   - Materials: ${await materialRepo.count()}`);
    return;
  }

  // 1. Seed Categories L1
  console.log("📂 Seeding Category L1...");
  for (const cat of CATEGORY_L1) {
    const entity = categoryL1Repo.create(cat);
    await categoryL1Repo.save(entity);
  }
  console.log(`   ✅ Created ${CATEGORY_L1.length} L1 categories`);

  // 2. Seed Categories L2
  console.log("📂 Seeding Category L2...");
  for (const cat of CATEGORY_L2) {
    const entity = categoryL2Repo.create(cat);
    await categoryL2Repo.save(entity);
  }
  console.log(`   ✅ Created ${CATEGORY_L2.length} L2 categories`);

  // 3. Seed Building Profiles
  console.log("🏗️  Seeding Building Profiles...");
  for (const profile of BUILDING_PROFILES) {
    const entity = profileRepo.create(profile);
    await profileRepo.save(entity);
  }
  console.log(`   ✅ Created ${BUILDING_PROFILES.length} building profiles`);

  // 4. Seed Materials
  console.log("📦 Seeding Materials...");
  for (const material of MATERIALS) {
    const entity = materialRepo.create(material);
    await materialRepo.save(entity);
  }
  console.log(`   ✅ Created ${MATERIALS.length} materials`);

  // 5. Seed Rule Set
  console.log("📋 Seeding Rule Set...");
  const ruleSet = ruleSetRepo.create({
    version: "v1.0",
    effectiveFrom: new Date(),
    isCurrent: true,
    description: "CMM 初始規則集 v1.0 - 基於台灣營建業界標準",
  });
  await ruleSetRepo.save(ruleSet);
  console.log("   ✅ Created rule set v1.0");

  console.log("🎉 CMM seed completed successfully!");
}

// Export for CLI usage
export { BUILDING_PROFILES, MATERIALS, CATEGORY_L1, CATEGORY_L2 };
