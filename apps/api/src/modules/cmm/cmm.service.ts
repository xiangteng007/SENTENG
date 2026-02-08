import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere } from "typeorm";
import * as crypto from "crypto";

import {
  CmmMaterialMaster,
  MaterialCategory,
  MaterialStatus,
} from "./cmm-material-master.entity";
import {
  CmmBuildingProfile,
  StructureType,
} from "./cmm-building-profile.entity";
import { CmmUnitConversion } from "./cmm-unit-conversion.entity";
import {
  CmmCategoryL1,
  CmmCategoryL2,
  CmmCategoryL3,
  CmmRuleSet,
  CmmConversionRule,
  CmmCalculationRun,
  CmmMaterialBreakdown,
} from "./entities";
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  MaterialQueryDto,
  CalculateRequestDto as LegacyCalculateRequestDto,
  CalculateResponseDto,
  MaterialResultDto,
} from "./dto";
import {
  BUILDING_PROFILES,
  MATERIALS,
  CATEGORY_L1,
  CATEGORY_L2,
} from "./cmm.seed";
import {
  RunCalculationRequestDto,
  CalculationResultDto,
  ListRunsQueryDto,
  TaxonomyResponseDto,
  CategoryL1Dto,
  CategoryL2Dto,
  MaterialBreakdownLineDto,
  SuggestedEstimateLineDto,
} from "./dto/calculation.dto";

@Injectable()
export class CmmService {
  // 坪轉平方米係數
  private readonly PING_TO_SQM = 3.30579;

  constructor(
    @InjectRepository(CmmMaterialMaster)
    private readonly materialRepo: Repository<CmmMaterialMaster>,
    @InjectRepository(CmmBuildingProfile)
    private readonly profileRepo: Repository<CmmBuildingProfile>,
    @InjectRepository(CmmUnitConversion)
    private readonly conversionRepo: Repository<CmmUnitConversion>,
    @InjectRepository(CmmCategoryL1)
    private readonly categoryL1Repo: Repository<CmmCategoryL1>,
    @InjectRepository(CmmCategoryL2)
    private readonly categoryL2Repo: Repository<CmmCategoryL2>,
    @InjectRepository(CmmCategoryL3)
    private readonly categoryL3Repo: Repository<CmmCategoryL3>,
    @InjectRepository(CmmRuleSet)
    private readonly ruleSetRepo: Repository<CmmRuleSet>,
    @InjectRepository(CmmConversionRule)
    private readonly conversionRuleRepo: Repository<CmmConversionRule>,
    @InjectRepository(CmmCalculationRun)
    private readonly calculationRunRepo: Repository<CmmCalculationRun>,
    @InjectRepository(CmmMaterialBreakdown)
    private readonly breakdownRepo: Repository<CmmMaterialBreakdown>,
  ) {}

  // ==================== Taxonomy (分類體系) ====================

  async getTaxonomy(): Promise<TaxonomyResponseDto> {
    const l1Categories = await this.categoryL1Repo.find({
      where: { isActive: true },
      order: { sortOrder: "ASC" },
    });

    const categories: CategoryL1Dto[] = [];

    for (const l1 of l1Categories) {
      const l2Categories = await this.categoryL2Repo.find({
        where: { l1Code: l1.code, isActive: true },
        order: { sortOrder: "ASC" },
      });

      const l2Dtos: CategoryL2Dto[] = [];
      for (const l2 of l2Categories) {
        const l3Categories = await this.categoryL3Repo.find({
          where: { l2Code: l2.code, isActive: true },
          order: { sortOrder: "ASC" },
        });

        l2Dtos.push({
          code: l2.code,
          name: l2.name,
          defaultUnit: l2.defaultUnit,
          children: l3Categories.map((l3) => ({
            code: l3.code,
            name: l3.name,
            defaultMaterials: l3.defaultMaterials,
          })),
        });
      }

      categories.push({
        code: l1.code,
        name: l1.name,
        children: l2Dtos,
      });
    }

    return { categories };
  }

  async getTaxonomyByL1(l1Code: string) {
    const l1 = await this.categoryL1Repo.findOne({ where: { code: l1Code } });
    if (!l1) {
      throw new NotFoundException(`Category L1 ${l1Code} not found`);
    }

    const l2Categories = await this.categoryL2Repo.find({
      where: { l1Code: l1.code, isActive: true },
      order: { sortOrder: "ASC" },
    });

    const result: CategoryL2Dto[] = [];
    for (const l2 of l2Categories) {
      const l3Categories = await this.categoryL3Repo.find({
        where: { l2Code: l2.code, isActive: true },
        order: { sortOrder: "ASC" },
      });

      result.push({
        code: l2.code,
        name: l2.name,
        defaultUnit: l2.defaultUnit,
        children: l3Categories.map((l3) => ({
          code: l3.code,
          name: l3.name,
          defaultMaterials: l3.defaultMaterials,
        })),
      });
    }

    return { l1Code, l1Name: l1.name, categories: result };
  }

  // ==================== Rule Sets (規則集) ====================

  async listRuleSets() {
    return this.ruleSetRepo.find({ order: { effectiveFrom: "DESC" } });
  }

  async getCurrentRuleSet(): Promise<CmmRuleSet> {
    const current = await this.ruleSetRepo.findOne({
      where: { isCurrent: true },
    });
    if (!current) {
      // Fallback to latest
      const latest = await this.ruleSetRepo.findOne({
        order: { effectiveFrom: "DESC" },
      });
      if (!latest) {
        throw new NotFoundException("No rule set found");
      }
      return latest;
    }
    return current;
  }

  // ==================== Calculation Runs (計算執行) ====================

  async executeCalculationRun(
    dto: RunCalculationRequestDto,
  ): Promise<CalculationResultDto> {
    const startTime = Date.now();

    // 1. Get rule set
    const ruleSet = dto.ruleSetVersion
      ? await this.ruleSetRepo.findOne({
          where: { version: dto.ruleSetVersion },
        })
      : await this.getCurrentRuleSet();

    if (!ruleSet) {
      throw new NotFoundException(
        `Rule set ${dto.ruleSetVersion || "current"} not found`,
      );
    }

    // 2. Create input hash
    const inputSnapshot = {
      categoryL1: dto.categoryL1,
      workItems: dto.workItems,
      ruleSetVersion: ruleSet.version,
    };
    const inputHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(inputSnapshot))
      .digest("hex");

    // 3. Create calculation run record
    const run = this.calculationRunRepo.create({
      projectId: dto.projectId,
      categoryL1: dto.categoryL1,
      ruleSetVersion: ruleSet.version,
      inputSnapshot,
      inputHash,
      status: "RUNNING",
    });
    await this.calculationRunRepo.save(run);

    try {
      // 4. Execute calculation for each work item
      const breakdownLines: CmmMaterialBreakdown[] = [];
      const errors: { itemCode: string; message: string }[] = [];

      for (const workItem of dto.workItems) {
        try {
          const materials = await this.calculateWorkItem(
            workItem,
            dto.categoryL1,
            ruleSet.version,
          );
          for (const material of materials) {
            const breakdown = this.breakdownRepo.create({
              runId: run.runId,
              sourceWorkItemCode: workItem.itemCode,
              categoryL1: dto.categoryL1,
              categoryL2: workItem.categoryL2,
              categoryL3: workItem.categoryL3,
              ...material,
            });
            breakdownLines.push(breakdown);
          }
        } catch (err) {
          errors.push({ itemCode: workItem.itemCode, message: err.message });
        }
      }

      // 5. Save breakdown lines
      if (breakdownLines.length > 0) {
        await this.breakdownRepo.save(breakdownLines);
      }

      // 6. Update run status
      const durationMs = Date.now() - startTime;
      run.status = errors.length > 0 ? "PARTIAL" : "SUCCESS";
      run.durationMs = durationMs;
      run.resultSummary = {
        totalLines: breakdownLines.length,
        errorCount: errors.length,
      };
      if (errors.length > 0) {
        run.errorLog = errors;
      }
      await this.calculationRunRepo.save(run);

      // 7. Build response
      return this.buildCalculationResult(run, breakdownLines, errors);
    } catch (err) {
      run.status = "FAILED";
      run.errorLog = { message: err.message };
      run.durationMs = Date.now() - startTime;
      await this.calculationRunRepo.save(run);
      throw err;
    }
  }

  private async calculateWorkItem(
    workItem: RunCalculationRequestDto["workItems"][0],
    _categoryL1: string,
    _ruleSetVersion: string,
  ): Promise<Partial<CmmMaterialBreakdown>[]> {
    // Get L3 template if available
    const l3 = workItem.categoryL3
      ? await this.categoryL3Repo.findOne({
          where: { code: workItem.categoryL3 },
        })
      : null;

    // Get waste factor for this category
    const wasteFactor = await this.getWasteFactor(workItem.categoryL2);

    const materials: Partial<CmmMaterialBreakdown>[] = [];

    if (l3?.defaultMaterials && Array.isArray(l3.defaultMaterials)) {
      // Expand BOM from template
      for (const materialName of l3.defaultMaterials) {
        const baseQuantity = workItem.quantity;
        const finalQuantity = baseQuantity * (1 + wasteFactor);

        materials.push({
          materialName,
          baseQuantity,
          wasteFactor,
          finalQuantity: Math.round(finalQuantity * 100) / 100,
          unit: workItem.unit,
          traceInfo: {
            ruleApplied: "L3_TEMPLATE_EXPANSION",
            conversionFormula: `${baseQuantity} × (1 + ${wasteFactor}) = ${finalQuantity}`,
          },
        });
      }
    } else {
      // Single material passthrough
      const baseQuantity = workItem.quantity;
      const finalQuantity = baseQuantity * (1 + wasteFactor);

      materials.push({
        materialName: workItem.itemCode,
        baseQuantity,
        wasteFactor,
        finalQuantity: Math.round(finalQuantity * 100) / 100,
        unit: workItem.unit,
        traceInfo: {
          ruleApplied: "PASSTHROUGH",
          conversionFormula: `${baseQuantity} × (1 + ${wasteFactor}) = ${finalQuantity}`,
        },
      });
    }

    return materials;
  }

  private async getWasteFactor(categoryL2: string): Promise<number> {
    // Hardcoded defaults for now - will be loaded from cmm_waste_factors table
    const defaultFactors: Record<string, number> = {
      CON_REBAR: 0.03,
      CON_CONC: 0.03,
      INT_TILE: 0.1,
      INT_PAINT: 0.05,
      INT_WOOD: 0.08,
    };
    return defaultFactors[categoryL2] || 0.05;
  }

  private buildCalculationResult(
    run: CmmCalculationRun,
    breakdownLines: CmmMaterialBreakdown[],
    errors: { itemCode: string; message: string }[],
  ): CalculationResultDto {
    const materialBreakdown: MaterialBreakdownLineDto[] = breakdownLines.map(
      (line) => ({
        id: line.id,
        sourceWorkItemCode: line.sourceWorkItemCode || "",
        categoryL1: line.categoryL1 || "",
        categoryL2: line.categoryL2 || "",
        categoryL3: line.categoryL3,
        materialCode: line.materialCode,
        materialName: line.materialName,
        spec: line.spec,
        baseQuantity: Number(line.baseQuantity),
        wasteFactor: Number(line.wasteFactor),
        finalQuantity: Number(line.finalQuantity),
        unit: line.unit,
        packagingUnit: line.packagingUnit,
        packagingQuantity: line.packagingQuantity,
        unitPrice: line.unitPrice ? Number(line.unitPrice) : undefined,
        subtotal: line.subtotal ? Number(line.subtotal) : undefined,
        traceInfo: line.traceInfo,
      }),
    );

    const suggestedEstimateLines: SuggestedEstimateLineDto[] =
      breakdownLines.map((line) => ({
        id: line.id,
        name: line.materialName,
        spec: line.spec,
        quantity: Number(line.finalQuantity),
        unit: line.unit,
        unitPrice: line.unitPrice ? Number(line.unitPrice) : undefined,
        subtotal: line.subtotal ? Number(line.subtotal) : undefined,
        categoryL1: line.categoryL1 || "",
        categoryL2: line.categoryL2 || "",
        sourceRunId: run.runId,
      }));

    return {
      runId: run.runId,
      ruleSetVersion: run.ruleSetVersion,
      timestamp: run.createdAt.toISOString(),
      status: run.status,
      inputSnapshotHash: run.inputHash,
      durationMs: run.durationMs,
      materialBreakdown,
      suggestedEstimateLines,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async listCalculationRuns(query: ListRunsQueryDto) {
    const where: FindOptionsWhere<CmmCalculationRun> = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.categoryL1) where.categoryL1 = query.categoryL1;

    const [items, total] = await this.calculationRunRepo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      take: query.limit || 20,
      skip: query.offset || 0,
    });

    return {
      items: items.map((run) => ({
        runId: run.runId,
        projectId: run.projectId,
        categoryL1: run.categoryL1,
        ruleSetVersion: run.ruleSetVersion,
        status: run.status,
        durationMs: run.durationMs,
        createdAt: run.createdAt,
        resultSummary: run.resultSummary,
      })),
      total,
      limit: query.limit || 20,
      offset: query.offset || 0,
    };
  }

  async getCalculationRunResult(runId: string): Promise<CalculationResultDto> {
    const run = await this.calculationRunRepo.findOne({
      where: { runId },
      relations: ["materialBreakdown"],
    });

    if (!run) {
      throw new NotFoundException(`Calculation run ${runId} not found`);
    }

    return this.buildCalculationResult(
      run,
      run.materialBreakdown || [],
      (Array.isArray(run.errorLog) ? run.errorLog : []) as { itemCode: string; message: string }[],
    );
  }

  // ==================== Materials CRUD ====================

  async findAllMaterials(query: MaterialQueryDto) {
    const { category, status, search, page = 1, limit = 20 } = query;
    const where: FindOptionsWhere<CmmMaterialMaster> = {};

    if (category) where.category = category;
    if (status) where.status = status;

    const [items, total] = await this.materialRepo.findAndCount({
      where,
      relations: ["unitConversions"],
      skip: (page - 1) * limit,
      take: limit,
      order: { code: "ASC" },
    });

    // Apply search filter if provided
    let filteredItems = items;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = items.filter(
        (m) =>
          m.code.toLowerCase().includes(searchLower) ||
          m.name.toLowerCase().includes(searchLower),
      );
    }

    return {
      items: filteredItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMaterialById(id: string): Promise<CmmMaterialMaster> {
    const material = await this.materialRepo.findOne({
      where: { id },
      relations: ["unitConversions"],
    });
    if (!material) {
      throw new NotFoundException(`Material ${id} not found`);
    }
    return material;
  }

  async findMaterialByCode(code: string): Promise<CmmMaterialMaster> {
    const material = await this.materialRepo.findOne({
      where: { code },
      relations: ["unitConversions"],
    });
    if (!material) {
      throw new NotFoundException(`Material with code ${code} not found`);
    }
    return material;
  }

  async createMaterial(dto: CreateMaterialDto): Promise<CmmMaterialMaster> {
    // Check for duplicate code
    const existing = await this.materialRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Material with code ${dto.code} already exists`,
      );
    }

    const material = this.materialRepo.create(dto);
    return this.materialRepo.save(material);
  }

  async updateMaterial(
    id: string,
    dto: UpdateMaterialDto,
  ): Promise<CmmMaterialMaster> {
    const material = await this.findMaterialById(id);
    Object.assign(material, dto);
    return this.materialRepo.save(material);
  }

  async deleteMaterial(id: string): Promise<void> {
    const material = await this.findMaterialById(id);
    await this.materialRepo.softRemove(material);
  }

  // ==================== Building Profiles ====================

  async findAllProfiles() {
    return this.profileRepo.find({ order: { code: "ASC" } });
  }

  async findProfileByCode(code: string): Promise<CmmBuildingProfile> {
    const profile = await this.profileRepo.findOne({ where: { code } });
    if (!profile) {
      throw new NotFoundException(`Building profile ${code} not found`);
    }
    return profile;
  }

  async findProfileByStructure(
    structureType: StructureType,
    floorCount: number,
  ): Promise<CmmBuildingProfile | null> {
    // Find profile that matches structure type and floor range
    const profiles = await this.profileRepo.find({
      where: { structureType },
      order: { minFloors: "ASC" },
    });

    for (const profile of profiles) {
      const minOk = floorCount >= profile.minFloors;
      const maxOk = !profile.maxFloors || floorCount <= profile.maxFloors;
      if (minOk && maxOk) {
        return profile;
      }
    }

    // Fallback: return first matching structure type
    return profiles[0] || null;
  }

  // ==================== Legacy Calculation Engine ====================

  async calculate(
    dto: LegacyCalculateRequestDto,
  ): Promise<CalculateResponseDto> {
    // 1. Find or determine building profile
    let profile: CmmBuildingProfile | null = null;

    if (dto.profileCode) {
      profile = await this.findProfileByCode(dto.profileCode);
    } else {
      profile = await this.findProfileByStructure(
        dto.structureType,
        dto.floorCount,
      );
    }

    if (!profile) {
      throw new NotFoundException(
        `No building profile found for ${dto.structureType} with ${dto.floorCount} floors`,
      );
    }

    // 2. Calculate total areas
    const totalFloors = dto.floorCount + (dto.basementCount || 0);
    const totalArea = dto.floorArea * totalFloors;
    const totalAreaPing = totalArea / this.PING_TO_SQM;

    // 3. Calculate materials using profile factors
    const rebar = this.calculateLegacyMaterial(
      "REBAR",
      totalArea,
      profile.rebarFactor,
      profile.rebarUnit,
    );

    const concrete = this.calculateLegacyMaterial(
      "CONCRETE",
      totalArea,
      profile.concreteFactor,
      profile.concreteUnit,
    );

    const formwork = this.calculateLegacyMaterial(
      "FORMWORK",
      totalArea,
      profile.formworkFactor,
      profile.formworkUnit,
    );

    // Steel (SRC/SC only)
    let steel: MaterialResultDto | undefined;
    if (
      profile.steelFactor &&
      (dto.structureType === StructureType.SRC ||
        dto.structureType === StructureType.SC)
    ) {
      steel = this.calculateLegacyMaterial(
        "STEEL",
        totalArea,
        profile.steelFactor,
        profile.steelUnit || "kg/m²",
      );
    }

    // Mortar
    let mortar: MaterialResultDto | undefined;
    if (profile.mortarFactor) {
      mortar = this.calculateLegacyMaterial(
        "MORTAR",
        totalArea,
        profile.mortarFactor,
        profile.mortarUnit || "m³/m²",
      );
    }

    // 4. Build response
    const response: CalculateResponseDto = {
      totalArea,
      totalAreaPing: Math.round(totalAreaPing * 100) / 100,
      rebar,
      concrete,
      formwork,
      steel,
      mortar,
      profileUsed: {
        code: profile.code,
        name: profile.name,
        structureType: profile.structureType,
      },
      version: 1,
      calculatedAt: new Date(),
      inputSnapshot: dto,
    };

    return response;
  }

  private calculateLegacyMaterial(
    category: string,
    totalArea: number,
    factor: number,
    factorUnit: string,
  ): MaterialResultDto {
    // Parse unit to determine output
    const quantity = totalArea * Number(factor);
    const unit = this.getOutputUnit(factorUnit);

    return {
      category,
      quantity: Math.round(quantity * 100) / 100,
      unit,
      perSqm: Number(factor),
    };
  }

  private getOutputUnit(factorUnit: string): string {
    // factorUnit examples: 'kg/m²', 'm³/m²', 'm²/m²'
    if (factorUnit.includes("/")) {
      return factorUnit.split("/")[0];
    }
    return factorUnit;
  }

  // ==================== Unit Conversion ====================

  async convertUnit(
    materialId: string,
    fromUnit: string,
    toUnit: string,
    value: number,
  ): Promise<{ result: number; formula: string }> {
    const conversion = await this.conversionRepo.findOne({
      where: { materialId, fromUnit, toUnit },
    });

    if (conversion) {
      return {
        result: value * Number(conversion.conversionFactor),
        formula:
          conversion.formula ||
          `${value} ${fromUnit} × ${conversion.conversionFactor} = result ${toUnit}`,
      };
    }

    const reverseConversion = await this.conversionRepo.findOne({
      where: { materialId, fromUnit: toUnit, toUnit: fromUnit },
    });

    if (reverseConversion && reverseConversion.isBidirectional) {
      const factor = 1 / Number(reverseConversion.conversionFactor);
      return {
        result: value * factor,
        formula: `${value} ${fromUnit} × ${factor.toFixed(6)} = result ${toUnit}`,
      };
    }

    throw new NotFoundException(
      `No conversion rule found for ${fromUnit} to ${toUnit}`,
    );
  }

  // ==================== Seed Data (資料初始化) ====================

  /**
   * 初始化 CMM 預設資料
   * @returns 建立的資料數量統計
   */
  async seedDefaultData(): Promise<{
    profiles: number;
    materials: number;
    categoriesL1: number;
    categoriesL2: number;
    ruleSet: boolean;
  }> {
    const result = {
      profiles: 0,
      materials: 0,
      categoriesL1: 0,
      categoriesL2: 0,
      ruleSet: false,
    };

    // Check if already seeded
    const existingProfiles = await this.profileRepo.count();
    if (existingProfiles > 0) {
      return result; // Already seeded
    }

    // Seed Categories L1
    for (const cat of CATEGORY_L1) {
      try {
        const entity = this.categoryL1Repo.create(cat);
        await this.categoryL1Repo.save(entity);
        result.categoriesL1++;
      } catch (e) {
        // Skip duplicates
      }
    }

    // Seed Categories L2
    for (const cat of CATEGORY_L2) {
      try {
        const entity = this.categoryL2Repo.create(cat);
        await this.categoryL2Repo.save(entity);
        result.categoriesL2++;
      } catch (e) {
        // Skip duplicates
      }
    }

    // Seed Building Profiles
    for (const profile of BUILDING_PROFILES) {
      try {
        const entity = this.profileRepo.create(profile);
        await this.profileRepo.save(entity);
        result.profiles++;
      } catch (e) {
        // Skip duplicates
      }
    }

    // Seed Materials
    for (const material of MATERIALS) {
      try {
        const entity = this.materialRepo.create(material);
        await this.materialRepo.save(entity);
        result.materials++;
      } catch (e) {
        // Skip duplicates
      }
    }

    // Seed Rule Set
    const existingRuleSet = await this.ruleSetRepo.findOne({
      where: { isCurrent: true },
    });
    if (!existingRuleSet) {
      const ruleSet = this.ruleSetRepo.create({
        version: "v1.0",
        effectiveFrom: new Date(),
        isCurrent: true,
        description: "CMM 初始規則集 v1.0 - 基於台灣營建業界標準",
      });
      await this.ruleSetRepo.save(ruleSet);
      result.ruleSet = true;
    }

    return result;
  }
}
