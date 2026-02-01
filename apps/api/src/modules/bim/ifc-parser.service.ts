import { Injectable, Logger } from "@nestjs/common";

/**
 * IFC (Industry Foundation Classes) 解析服務
 *
 * 從 BIM IFC 檔案提取建築構件數量資訊，用於估價整合。
 *
 * @note POC 版本 - 實際解析需安裝: npm install web-ifc
 *       並將 parseFile 中的實作切換為使用 web-ifc 模組
 *
 * 支援構件類型：
 * - IfcWall (牆)
 * - IfcSlab (樓板)
 * - IfcColumn (柱)
 * - IfcBeam (梁)
 * - IfcDoor (門)
 * - IfcWindow (窗)
 */

export type IfcElementType =
  | "IfcWall"
  | "IfcSlab"
  | "IfcColumn"
  | "IfcBeam"
  | "IfcDoor"
  | "IfcWindow"
  | "IfcStair"
  | "IfcRoof"
  | "IfcFooting";

export interface IfcElement {
  id: number;
  expressId: number;
  type: IfcElementType;
  name: string;
  globalId: string;
  material?: string;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    area?: number;
    volume?: number;
  };
  properties: Record<string, unknown>;
}

export interface QuantityTakeoff {
  walls: { totalArea: number; totalVolume: number; count: number };
  slabs: { totalArea: number; totalVolume: number; count: number };
  columns: { totalCount: number; totalVolume: number };
  beams: { totalLength: number; totalVolume: number; count: number };
  doors: { count: number; byType: Record<string, number> };
  windows: { count: number; totalArea: number; byType: Record<string, number> };
  stairs: { count: number };
}

export interface EstimationItem {
  category: string;
  itemName: string;
  spec: string;
  unit: string;
  quantity: number;
  source: "IFC";
  ifcElementType: IfcElementType;
}

@Injectable()
export class IfcParserService {
  private readonly logger = new Logger(IfcParserService.name);

  /**
   * 解析 IFC 檔案並提取構件資訊
   *
   * @note POC 版本: 目前返回 mock data
   *       要啟用真實解析:
   *       1. npm install web-ifc
   *       2. 取消下方 web-ifc 相關程式碼的註解
   */
  async parseFile(_fileBuffer: Buffer): Promise<IfcElement[]> {
    this.logger.log("Starting IFC file parsing (POC mode)...");

    // POC: Return mock data
    // For production, install web-ifc and uncomment the real implementation below
    this.logger.warn(
      "IFC parsing in POC mode - returning mock data. " +
        "Install web-ifc for actual IFC parsing.",
    );
    return this.getMockElements();

    // === Real Implementation (uncomment when web-ifc is installed) ===
    // const WebIFC = await import('web-ifc');
    // const ifcApi = new WebIFC.IfcAPI();
    // await ifcApi.Init();
    // const modelId = ifcApi.OpenModel(new Uint8Array(fileBuffer));
    // ... parse elements ...
    // ifcApi.CloseModel(modelId);
  }

  /**
   * 從構件列表計算數量統計
   */
  extractQuantities(elements: IfcElement[]): QuantityTakeoff {
    const takeoff: QuantityTakeoff = {
      walls: { totalArea: 0, totalVolume: 0, count: 0 },
      slabs: { totalArea: 0, totalVolume: 0, count: 0 },
      columns: { totalCount: 0, totalVolume: 0 },
      beams: { totalLength: 0, totalVolume: 0, count: 0 },
      doors: { count: 0, byType: {} },
      windows: { count: 0, totalArea: 0, byType: {} },
      stairs: { count: 0 },
    };

    for (const el of elements) {
      switch (el.type) {
        case "IfcWall":
          takeoff.walls.count++;
          takeoff.walls.totalArea += el.dimensions.area || 0;
          takeoff.walls.totalVolume += el.dimensions.volume || 0;
          break;
        case "IfcSlab":
          takeoff.slabs.count++;
          takeoff.slabs.totalArea += el.dimensions.area || 0;
          takeoff.slabs.totalVolume += el.dimensions.volume || 0;
          break;
        case "IfcColumn":
          takeoff.columns.totalCount++;
          takeoff.columns.totalVolume += el.dimensions.volume || 0;
          break;
        case "IfcBeam":
          takeoff.beams.count++;
          takeoff.beams.totalLength += el.dimensions.length || 0;
          takeoff.beams.totalVolume += el.dimensions.volume || 0;
          break;
        case "IfcDoor":
          takeoff.doors.count++;
          takeoff.doors.byType[el.name] =
            (takeoff.doors.byType[el.name] || 0) + 1;
          break;
        case "IfcWindow":
          takeoff.windows.count++;
          takeoff.windows.totalArea += el.dimensions.area || 0;
          takeoff.windows.byType[el.name] =
            (takeoff.windows.byType[el.name] || 0) + 1;
          break;
        case "IfcStair":
          takeoff.stairs.count++;
          break;
      }
    }

    return takeoff;
  }

  /**
   * 將構件轉換為估價項目
   */
  mapToEstimationItems(elements: IfcElement[]): EstimationItem[] {
    const items: EstimationItem[] = [];
    const takeoff = this.extractQuantities(elements);

    if (takeoff.walls.count > 0) {
      items.push({
        category: "隔間工程",
        itemName: "隔間牆施作",
        spec: "IFC 自動估算",
        unit: "㎡",
        quantity: Math.round(takeoff.walls.totalArea * 100) / 100,
        source: "IFC",
        ifcElementType: "IfcWall",
      });
    }

    if (takeoff.slabs.count > 0) {
      items.push({
        category: "結構工程",
        itemName: "樓板混凝土",
        spec: "IFC 自動估算",
        unit: "㎥",
        quantity: Math.round(takeoff.slabs.totalVolume * 100) / 100,
        source: "IFC",
        ifcElementType: "IfcSlab",
      });
    }

    if (takeoff.columns.totalCount > 0) {
      items.push({
        category: "結構工程",
        itemName: "柱混凝土",
        spec: "IFC 自動估算",
        unit: "㎥",
        quantity: Math.round(takeoff.columns.totalVolume * 100) / 100,
        source: "IFC",
        ifcElementType: "IfcColumn",
      });
    }

    if (takeoff.doors.count > 0) {
      items.push({
        category: "門窗工程",
        itemName: "門安裝",
        spec: "IFC 自動估算",
        unit: "樘",
        quantity: takeoff.doors.count,
        source: "IFC",
        ifcElementType: "IfcDoor",
      });
    }

    if (takeoff.windows.count > 0) {
      items.push({
        category: "門窗工程",
        itemName: "窗安裝",
        spec: "IFC 自動估算",
        unit: "樘",
        quantity: takeoff.windows.count,
        source: "IFC",
        ifcElementType: "IfcWindow",
      });
    }

    return items;
  }

  /**
   * Mock data for POC demonstration
   */
  private getMockElements(): IfcElement[] {
    return [
      {
        id: 1,
        expressId: 101,
        type: "IfcWall",
        name: "Wall-001",
        globalId: "mock-wall-1",
        dimensions: { area: 25, volume: 5 },
        properties: {},
      },
      {
        id: 2,
        expressId: 102,
        type: "IfcWall",
        name: "Wall-002",
        globalId: "mock-wall-2",
        dimensions: { area: 30, volume: 6 },
        properties: {},
      },
      {
        id: 3,
        expressId: 201,
        type: "IfcSlab",
        name: "Slab-001",
        globalId: "mock-slab-1",
        dimensions: { area: 100, volume: 15 },
        properties: {},
      },
      {
        id: 4,
        expressId: 301,
        type: "IfcColumn",
        name: "Column-001",
        globalId: "mock-column-1",
        dimensions: { volume: 0.5 },
        properties: {},
      },
      {
        id: 5,
        expressId: 401,
        type: "IfcDoor",
        name: "Door-Standard",
        globalId: "mock-door-1",
        dimensions: {},
        properties: {},
      },
      {
        id: 6,
        expressId: 501,
        type: "IfcWindow",
        name: "Window-Standard",
        globalId: "mock-window-1",
        dimensions: { area: 2.5 },
        properties: {},
      },
    ];
  }
}
