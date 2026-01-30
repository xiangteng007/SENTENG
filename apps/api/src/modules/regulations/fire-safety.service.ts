import { Injectable, Logger } from '@nestjs/common';

/**
 * 消防法規計算服務
 *
 * 依據「各類場所消防安全設備設置標準」提供自動計算
 *
 * 參考法規:
 * - 消防法 第 6 條
 * - 各類場所消防安全設備設置標準
 */

export interface FireSafetyInput {
  buildingType: BuildingType;
  totalFloorArea: number; // 總樓地板面積 (m²)
  floors: number;
  basementFloors: number;
  occupancy: number; // 收容人數
  hasAutoSprinkler: boolean;
  hasFireAlarm: boolean;
}

export interface FireSafetyResult {
  extinguishers: ExtinguisherRequirement;
  exitDistance: ExitDistanceRequirement;
  exitWidth: ExitWidthRequirement;
  smokeDetectors: SmokeDetectorRequirement;
  emergencyLighting: EmergencyLightingRequirement;
  violations: string[];
  compliant: boolean;
}

export interface ExtinguisherRequirement {
  required: boolean;
  count: number;
  type: string;
  rating: string;
  spacing: number; // 步行距離 (m)
}

export interface ExitDistanceRequirement {
  maxDistance: number; // 最大步行距離 (m)
  currentStandard: number;
  compliant: boolean;
}

export interface ExitWidthRequirement {
  minWidth: number; // 最小出口寬度 (cm)
  totalRequired: number; // 總出口寬度 (cm)
  perPerson: number; // 每人所需 (cm)
}

export interface SmokeDetectorRequirement {
  required: boolean;
  count: number;
  spacing: number; // 間距 (m)
  coverage: number; // 每個偵測器覆蓋面積 (m²)
}

export interface EmergencyLightingRequirement {
  required: boolean;
  count: number;
  duration: number; // 照明時間 (分鐘)
  illumination: number; // 照度 (lux)
}

export type BuildingType =
  | 'residential' // 住宅
  | 'office' // 辦公
  | 'commercial' // 商業
  | 'industrial' // 工廠
  | 'warehouse' // 倉庫
  | 'assembly' // 聚會場所
  | 'educational' // 學校
  | 'medical' // 醫療
  | 'hotel'; // 旅館

@Injectable()
export class FireSafetyService {
  private readonly logger = new Logger(FireSafetyService.name);

  // 滅火器設置標準 (依建築類型)
  private readonly EXTINGUISHER_STANDARDS: Record<
    BuildingType,
    { spacing: number; rating: string }
  > = {
    residential: { spacing: 25, rating: '3A10B' },
    office: { spacing: 20, rating: '3A10B' },
    commercial: { spacing: 15, rating: '4A20B' },
    industrial: { spacing: 15, rating: '4A40B' },
    warehouse: { spacing: 20, rating: '4A40B' },
    assembly: { spacing: 15, rating: '4A20B' },
    educational: { spacing: 20, rating: '3A10B' },
    medical: { spacing: 15, rating: '3A10B' },
    hotel: { spacing: 20, rating: '3A10B' },
  };

  // 逃生距離標準 (m)
  private readonly EXIT_DISTANCE: Record<BuildingType, { normal: number; withSprinkler: number }> =
    {
      residential: { normal: 40, withSprinkler: 50 },
      office: { normal: 30, withSprinkler: 40 },
      commercial: { normal: 30, withSprinkler: 40 },
      industrial: { normal: 40, withSprinkler: 50 },
      warehouse: { normal: 50, withSprinkler: 60 },
      assembly: { normal: 25, withSprinkler: 30 },
      educational: { normal: 30, withSprinkler: 40 },
      medical: { normal: 25, withSprinkler: 30 },
      hotel: { normal: 30, withSprinkler: 40 },
    };

  /**
   * 計算消防設備需求
   */
  calculate(input: FireSafetyInput): FireSafetyResult {
    const violations: string[] = [];

    // 1. 滅火器計算
    const extinguishers = this.calculateExtinguishers(input);

    // 2. 逃生距離
    const exitDistance = this.calculateExitDistance(input);

    // 3. 出口寬度
    const exitWidth = this.calculateExitWidth(input);

    // 4. 煙霧偵測器
    const smokeDetectors = this.calculateSmokeDetectors(input);

    // 5. 緊急照明
    const emergencyLighting = this.calculateEmergencyLighting(input);

    // 檢查違規
    if (!exitDistance.compliant) {
      violations.push(`逃生距離超過標準 (最大 ${exitDistance.maxDistance}m)`);
    }

    if (!input.hasFireAlarm && input.totalFloorArea > 300) {
      violations.push('樓地板面積超過 300m² 應設置火警自動警報設備');
    }

    if (!input.hasAutoSprinkler && input.floors > 11) {
      violations.push('11 層以上建築應設置自動撒水設備');
    }

    return {
      extinguishers,
      exitDistance,
      exitWidth,
      smokeDetectors,
      emergencyLighting,
      violations,
      compliant: violations.length === 0,
    };
  }

  /**
   * 滅火器數量計算
   */
  private calculateExtinguishers(input: FireSafetyInput): ExtinguisherRequirement {
    const standard = this.EXTINGUISHER_STANDARDS[input.buildingType];

    // 依照覆蓋面積計算 (每個滅火器覆蓋約 100-150m²)
    const coveragePerUnit = input.hasAutoSprinkler ? 150 : 100;
    const countByCoverage = Math.ceil(input.totalFloorArea / coveragePerUnit);

    // 依照步行距離計算
    const countBySpacing = Math.ceil(input.totalFloorArea / (Math.PI * standard.spacing ** 2));

    const count = Math.max(countByCoverage, countBySpacing, 1);

    return {
      required: true,
      count,
      type: 'ABC 乾粉滅火器',
      rating: standard.rating,
      spacing: standard.spacing,
    };
  }

  /**
   * 逃生距離計算
   */
  private calculateExitDistance(input: FireSafetyInput): ExitDistanceRequirement {
    const standard = this.EXIT_DISTANCE[input.buildingType];
    const maxDistance = input.hasAutoSprinkler ? standard.withSprinkler : standard.normal;

    return {
      maxDistance,
      currentStandard: standard.normal,
      compliant: true, // 需實際測量後判斷
    };
  }

  /**
   * 出口寬度計算
   */
  private calculateExitWidth(input: FireSafetyInput): ExitWidthRequirement {
    // 依收容人數計算 (每 100 人 60cm，最小 120cm)
    const perPerson = 0.6; // cm per person
    const totalRequired = Math.max(input.occupancy * perPerson, 120);

    return {
      minWidth: 120, // 最小單一出口寬度
      totalRequired: Math.ceil(totalRequired),
      perPerson: perPerson * 100, // 轉換為每 100 人
    };
  }

  /**
   * 煙霧偵測器計算
   */
  private calculateSmokeDetectors(input: FireSafetyInput): SmokeDetectorRequirement {
    // 偵煙式探測器覆蓋面積 (依天花板高度)
    const coveragePerUnit = 60; // m² (一般 3m 天花板)
    const count = Math.ceil(input.totalFloorArea / coveragePerUnit);

    return {
      required: input.totalFloorArea > 300,
      count,
      spacing: 8, // m (偵煙式)
      coverage: coveragePerUnit,
    };
  }

  /**
   * 緊急照明計算
   */
  private calculateEmergencyLighting(input: FireSafetyInput): EmergencyLightingRequirement {
    // 每 50m² 設置一盞緊急照明燈
    const count = Math.ceil(input.totalFloorArea / 50);

    return {
      required: input.floors > 1 || input.basementFloors > 0,
      count,
      duration: 30, // 分鐘
      illumination: 1, // lux (地面)
    };
  }

  /**
   * 快速檢查 - 是否需要消防審查
   */
  requiresFireReview(input: {
    totalFloorArea: number;
    floors: number;
    buildingType: BuildingType;
  }): boolean {
    // 依「建造執照及雜項執照規定項目審查及簽證項目抽查作業要點」
    if (input.totalFloorArea > 500) return true;
    if (input.floors > 5) return true;
    if (['assembly', 'medical', 'hotel'].includes(input.buildingType)) return true;
    return false;
  }
}
