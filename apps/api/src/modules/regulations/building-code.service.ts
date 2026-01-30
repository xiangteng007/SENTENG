import { Injectable, Logger } from '@nestjs/common';

/**
 * 建築技術規則檢核服務
 *
 * 依據「建築技術規則建築設計施工編」提供自動檢核
 */

export interface BuildingCheckInput {
  buildingType: BuildingCategory;
  siteArea: number; // 基地面積 (m²)
  buildingArea: number; // 建築面積 (m²)
  totalFloorArea: number; // 總樓地板面積 (m²)
  floors: number; // 地上層數
  basementFloors: number; // 地下層數
  buildingHeight: number; // 建築物高度 (m)
  lot: LotInfo;
  setbacks: SetbackInfo;
  parking: ParkingInfo;
}

export interface LotInfo {
  frontRoadWidth: number; // 臨接道路寬度 (m)
  zoneType: ZoneType; // 使用分區
  bcr: number; // 法定建蔽率 (%)
  far: number; // 法定容積率 (%)
}

export interface SetbackInfo {
  front: number; // 前院深度 (m)
  rear: number; // 後院深度 (m)
  side: number; // 側院寬度 (m)
}

export interface ParkingInfo {
  provided: number; // 設置數量
  handicapped: number; // 無障礙車位
  motorcycle: number; // 機車位
  bicycle: number; // 自行車位
}

export type BuildingCategory =
  | 'A1'
  | 'A2' // 公共集會類
  | 'B1'
  | 'B2'
  | 'B3'
  | 'B4' // 商業類
  | 'C1'
  | 'C2' // 工業倉儲類
  | 'D1'
  | 'D2'
  | 'D3'
  | 'D4'
  | 'D5' // 休閒文教類
  | 'E' // 宗教殯葬類
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4' // 衛生福利類
  | 'G1'
  | 'G2'
  | 'G3' // 辦公服務類
  | 'H1'
  | 'H2' // 住宅類
  | 'I'; // 危險物品類

export type ZoneType =
  | 'residential1'
  | 'residential2'
  | 'residential3'
  | 'residential4'
  | 'commercial1'
  | 'commercial2'
  | 'commercial3'
  | 'commercial4'
  | 'industrial'
  | 'industrial_special'
  | 'agricultural';

export interface BuildingCheckResult {
  bcr: BcrCheckResult;
  far: FarCheckResult;
  height: HeightCheckResult;
  setback: SetbackCheckResult;
  parking: ParkingCheckResult;
  accessibility: AccessibilityCheckResult;
  violations: Violation[];
  compliant: boolean;
}

export interface BcrCheckResult {
  allowed: number; // 法定建蔽率 (%)
  actual: number; // 實際建蔽率 (%)
  compliant: boolean;
}

export interface FarCheckResult {
  allowed: number; // 法定容積率 (%)
  actual: number; // 實際容積率 (%)
  compliant: boolean;
  bonus?: number; // 容積獎勵 (%)
}

export interface HeightCheckResult {
  maxAllowed: number; // 最大允許高度 (m)
  actual: number; // 實際高度 (m)
  compliant: boolean;
  limitReason: string;
}

export interface SetbackCheckResult {
  frontRequired: number;
  rearRequired: number;
  sideRequired: number;
  compliant: boolean;
  violations: string[];
}

export interface ParkingCheckResult {
  required: number;
  provided: number;
  handicappedRequired: number;
  compliant: boolean;
}

export interface AccessibilityCheckResult {
  required: boolean;
  items: string[];
  compliant: boolean;
}

export interface Violation {
  code: string;
  regulation: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
}

@Injectable()
export class BuildingCodeService {
  private readonly logger = new Logger(BuildingCodeService.name);

  // 住宅區基準
  private readonly ZONE_STANDARDS: Record<ZoneType, { bcr: number; far: number }> = {
    residential1: { bcr: 60, far: 180 },
    residential2: { bcr: 60, far: 240 },
    residential3: { bcr: 50, far: 225 },
    residential4: { bcr: 50, far: 300 },
    commercial1: { bcr: 80, far: 360 },
    commercial2: { bcr: 70, far: 630 },
    commercial3: { bcr: 70, far: 560 },
    commercial4: { bcr: 70, far: 800 },
    industrial: { bcr: 70, far: 300 },
    industrial_special: { bcr: 70, far: 420 },
    agricultural: { bcr: 10, far: 60 },
  };

  /**
   * 執行建築技術規則檢核
   */
  check(input: BuildingCheckInput): BuildingCheckResult {
    const violations: Violation[] = [];

    // 1. 建蔽率檢核
    const bcr = this.checkBcr(input);
    if (!bcr.compliant) {
      violations.push({
        code: 'BCR-001',
        regulation: '建築技術規則建築設計施工編第 27 條',
        description: `建蔽率 ${bcr.actual.toFixed(1)}% 超過法定 ${bcr.allowed}%`,
        severity: 'critical',
      });
    }

    // 2. 容積率檢核
    const far = this.checkFar(input);
    if (!far.compliant) {
      violations.push({
        code: 'FAR-001',
        regulation: '建築技術規則建築設計施工編第 28 條',
        description: `容積率 ${far.actual.toFixed(1)}% 超過法定 ${far.allowed}%`,
        severity: 'critical',
      });
    }

    // 3. 高度檢核
    const height = this.checkHeight(input);
    if (!height.compliant) {
      violations.push({
        code: 'HGT-001',
        regulation: '建築技術規則建築設計施工編第 164 條',
        description: `建築物高度 ${height.actual}m 超過限制 ${height.maxAllowed}m`,
        severity: 'critical',
      });
    }

    // 4. 退縮檢核
    const setback = this.checkSetback(input);
    if (!setback.compliant) {
      setback.violations.forEach((v, i) => {
        violations.push({
          code: `STB-00${i + 1}`,
          regulation: '建築技術規則建築設計施工編第 110 條',
          description: v,
          severity: 'major',
        });
      });
    }

    // 5. 停車位檢核
    const parking = this.checkParking(input);
    if (!parking.compliant) {
      violations.push({
        code: 'PKG-001',
        regulation: '建築技術規則建築設計施工編第 59 條',
        description: `停車位不足: 需 ${parking.required} 個，提供 ${parking.provided} 個`,
        severity: 'major',
      });
    }

    // 6. 無障礙設施檢核
    const accessibility = this.checkAccessibility(input);
    if (!accessibility.compliant) {
      violations.push({
        code: 'ACC-001',
        regulation: '建築技術規則建築設計施工編第 170 條',
        description: '無障礙設施不符規定',
        severity: 'major',
      });
    }

    return {
      bcr,
      far,
      height,
      setback,
      parking,
      accessibility,
      violations,
      compliant: violations.length === 0,
    };
  }

  /**
   * 建蔽率計算
   */
  private checkBcr(input: BuildingCheckInput): BcrCheckResult {
    const allowed = input.lot.bcr || this.ZONE_STANDARDS[input.lot.zoneType]?.bcr || 60;
    const actual = (input.buildingArea / input.siteArea) * 100;

    return {
      allowed,
      actual,
      compliant: actual <= allowed,
    };
  }

  /**
   * 容積率計算
   */
  private checkFar(input: BuildingCheckInput): FarCheckResult {
    const allowed = input.lot.far || this.ZONE_STANDARDS[input.lot.zoneType]?.far || 200;
    const actual = (input.totalFloorArea / input.siteArea) * 100;

    return {
      allowed,
      actual,
      compliant: actual <= allowed,
    };
  }

  /**
   * 高度限制計算
   */
  private checkHeight(input: BuildingCheckInput): HeightCheckResult {
    // 依臨接道路寬度計算 (1.5 倍 + 6m)
    const maxByRoad = input.lot.frontRoadWidth * 1.5 + 6;

    // 依建蔽率計算 (建蔽率 60% 以下可較高)
    const bcrRatio = (input.buildingArea / input.siteArea) * 100;
    const maxByBcr = bcrRatio <= 60 ? 50 : 36;

    const maxAllowed = Math.min(maxByRoad, maxByBcr);

    return {
      maxAllowed,
      actual: input.buildingHeight,
      compliant: input.buildingHeight <= maxAllowed,
      limitReason: maxByRoad < maxByBcr ? '臨接道路寬度限制' : '建蔽率限制',
    };
  }

  /**
   * 退縮距離檢核
   */
  private checkSetback(input: BuildingCheckInput): SetbackCheckResult {
    const violations: string[] = [];

    // 前院深度 (依道路寬度)
    const frontRequired = input.lot.frontRoadWidth >= 15 ? 0 : 3;
    if (input.setbacks.front < frontRequired) {
      violations.push(`前院深度不足: 需 ${frontRequired}m，實際 ${input.setbacks.front}m`);
    }

    // 後院深度
    const rearRequired = input.floors > 5 ? 4 : 2;
    if (input.setbacks.rear < rearRequired) {
      violations.push(`後院深度不足: 需 ${rearRequired}m，實際 ${input.setbacks.rear}m`);
    }

    // 側院寬度
    const sideRequired = input.buildingHeight > 21 ? 3 : 1.5;
    if (input.setbacks.side < sideRequired) {
      violations.push(`側院寬度不足: 需 ${sideRequired}m，實際 ${input.setbacks.side}m`);
    }

    return {
      frontRequired,
      rearRequired,
      sideRequired,
      compliant: violations.length === 0,
      violations,
    };
  }

  /**
   * 停車位計算
   */
  private checkParking(input: BuildingCheckInput): ParkingCheckResult {
    // 依建築技術規則第 59 條
    let required = 0;

    if (input.buildingType.startsWith('H')) {
      // 住宅類: 每 150m² 設 1 位
      required = Math.ceil(input.totalFloorArea / 150);
    } else if (input.buildingType.startsWith('G')) {
      // 辦公類: 每 100m² 設 1 位
      required = Math.ceil(input.totalFloorArea / 100);
    } else if (input.buildingType.startsWith('B')) {
      // 商業類: 每 80m² 設 1 位
      required = Math.ceil(input.totalFloorArea / 80);
    } else {
      // 其他: 每 200m² 設 1 位
      required = Math.ceil(input.totalFloorArea / 200);
    }

    // 無障礙車位: 總數 2%，至少 1 個
    const handicappedRequired = Math.max(1, Math.ceil(required * 0.02));

    return {
      required,
      provided: input.parking.provided,
      handicappedRequired,
      compliant:
        input.parking.provided >= required && input.parking.handicapped >= handicappedRequired,
    };
  }

  /**
   * 無障礙設施檢核
   */
  private checkAccessibility(input: BuildingCheckInput): AccessibilityCheckResult {
    const items: string[] = [];

    // 依建築技術規則第 167-170 條
    if (input.floors > 1 || input.basementFloors > 0) {
      items.push('無障礙電梯');
    }

    if (input.totalFloorArea > 300) {
      items.push('無障礙廁所');
      items.push('無障礙通路');
    }

    if (input.parking.provided > 0) {
      items.push('無障礙停車位');
    }

    return {
      required: input.totalFloorArea > 200,
      items,
      compliant: true, // 需詳細檢核
    };
  }
}
