/**
 * Taiwan Government Open Data API Service
 *
 * Interfaces with Taiwan open data platforms:
 * - 公共工程標案 (PCC - Public Construction Commission)
 * - 建照執照查詢 (Building Permits)
 * - 公司登記查詢 (Company Registry - GCIS)
 */

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface TenderSearchParams {
  keyword?: string;
  orgId?: string;
  startDate?: string;
  endDate?: string;
  budgetMin?: number;
  budgetMax?: number;
  category?: "construction" | "engineering" | "all";
  page?: number;
  pageSize?: number;
}

export interface TenderResult {
  tenderId: string;
  title: string;
  orgName: string;
  budgetAmount: number;
  publishDate: string;
  closeDate: string;
  category: string;
  location: string;
  url: string;
}

export interface BuildingPermitSearchParams {
  permitNo?: string;
  address?: string;
  city?: string;
  district?: string;
  applicant?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface BuildingPermitResult {
  permitNo: string;
  issueDate: string;
  address: string;
  city: string;
  district: string;
  permitType: string;
  buildingType: string;
  floors: number;
  totalArea: number;
  applicant: string;
  builder: string;
  status: string;
}

export interface CompanySearchParams {
  companyName?: string;
  unifiedBusinessNo?: string;
  representative?: string;
  city?: string;
  industry?: string;
  page?: number;
  pageSize?: number;
}

export interface CompanyResult {
  unifiedBusinessNo: string;
  companyName: string;
  representative: string;
  address: string;
  capital: number;
  establishDate: string;
  status: string;
  industry: string[];
}

// GCIS API Response interfaces
interface GcisCompanyBasic {
  Business_Accounting_NO: string;
  Company_Name: string;
  Responsible_Name: string;
  Company_Location: string;
  Capital_Stock_Amount: number;
  Company_Setup_Date: string;
  Company_Status_Desc: string;
}

interface GcisResponse<T> {
  data: T[];
  totalCount?: number;
}

@Injectable()
export class TaiwanGovDataService {
  private readonly logger = new Logger(TaiwanGovDataService.name);
  private readonly pccApiKey: string;
  private readonly dataGovApiKey: string;

  // API endpoints
  private readonly GCIS_BASE_URL = "https://data.gcis.nat.gov.tw/od/data/api";
  private readonly PCC_BASE_URL = "https://pcc.g0v.ronny.tw/api";

  constructor(private readonly configService: ConfigService) {
    this.pccApiKey = this.configService.get("PCC_API_KEY", "");
    this.dataGovApiKey = this.configService.get("DATA_GOV_API_KEY", "");
  }

  /**
   * 公共工程標案查詢
   * Source: 行政院公共工程委員會 (via g0v community API)
   * API: https://pcc.g0v.ronny.tw/api/
   */
  async searchTenders(
    params: TenderSearchParams,
  ): Promise<{ data: TenderResult[]; total: number }> {
    this.logger.log(`Searching tenders with params: ${JSON.stringify(params)}`);

    try {
      const queryParams = new URLSearchParams();
      if (params.keyword) queryParams.append("query", params.keyword);
      if (params.page) queryParams.append("page", params.page.toString());

      const url = `${this.PCC_BASE_URL}/search?${queryParams.toString()}`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        this.logger.warn(`PCC API returned ${response.status}`);
        return this.getMockTenders();
      }

      const data = await response.json();
      const records = data.records || [];

      return {
        data: records.map((r: Record<string, unknown>) => ({
          tenderId:
            typeof r.id === "string" || typeof r.id === "number"
              ? String(r.id)
              : "",
          title: typeof r.name === "string" ? r.name : "",
          orgName: typeof r.unit === "string" ? r.unit : "",
          budgetAmount: typeof r.price === "number" ? r.price : 0,
          publishDate: typeof r.publish === "string" ? r.publish : "",
          closeDate: typeof r.end_date === "string" ? String(r.end_date) : "",
          category: typeof r.category === "string" ? r.category : "工程",
          location: typeof r.location === "string" ? r.location : "",
          url: `https://web.pcc.gov.tw/tps/QueryTender/query/searchTenderDetail?pk=${typeof r.id === "string" || typeof r.id === "number" ? r.id : ""}`,
        })),
        total: typeof data.total === "number" ? data.total : records.length,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch tenders: ${error}`);
      return this.getMockTenders();
    }
  }

  private getMockTenders(): { data: TenderResult[]; total: number } {
    return {
      data: [
        {
          tenderId: "PCC-2026-001234",
          title: "○○區○○路道路改善工程",
          orgName: "臺北市政府工務局",
          budgetAmount: 15000000,
          publishDate: "2026-01-15",
          closeDate: "2026-02-15",
          category: "工程",
          location: "臺北市",
          url: "https://web.pcc.gov.tw/tps/pss/tender.do?method=showPublish&searchMode=1&pkPmsMain=PCC-2026-001234",
        },
      ],
      total: 1,
    };
  }

  /**
   * 最新標案通知
   */
  async getLatestTenders(
    category?: string,
    limit?: number,
  ): Promise<TenderResult[]> {
    const result = await this.searchTenders({
      category: (category as TenderSearchParams["category"]) || "construction",
      pageSize: limit || 10,
    });
    return result.data;
  }

  /**
   * 建照執照查詢
   * Source: 內政部營建署
   * Note: Building permit data requires specific city APIs
   */
  async searchBuildingPermits(
    params: BuildingPermitSearchParams,
  ): Promise<{ data: BuildingPermitResult[]; total: number }> {
    this.logger.log(
      `Searching building permits with params: ${JSON.stringify(params)}`,
    );

    // Building permits require city-specific APIs or the national platform
    // For now, return mock data with proper structure
    // TODO: Implement city-specific APIs (Taipei, New Taipei, etc.)
    return {
      data: [
        {
          permitNo: "113建都造字第00123號",
          issueDate: "2024-03-15",
          address: params.address || "臺北市大安區某某路100號",
          city: params.city || "臺北市",
          district: params.district || "大安區",
          permitType: "建造執照",
          buildingType: "住宅",
          floors: 12,
          totalArea: 5200.5,
          applicant: "○○建設股份有限公司",
          builder: "○○營造股份有限公司",
          status: "核准",
        },
      ],
      total: 1,
    };
  }

  /**
   * 公司登記查詢
   * Source: 經濟部商業司 GCIS
   * API: https://data.gcis.nat.gov.tw/od/
   */
  async searchCompanies(
    params: CompanySearchParams,
  ): Promise<{ data: CompanyResult[]; total: number }> {
    this.logger.log(
      `Searching companies with params: ${JSON.stringify(params)}`,
    );

    try {
      // Use GCIS unified business number lookup
      if (params.unifiedBusinessNo) {
        return this.lookupByUnifiedBusinessNo(params.unifiedBusinessNo);
      }

      // Use company name search
      if (params.companyName) {
        return this.searchByCompanyName(params.companyName);
      }

      return { data: [], total: 0 };
    } catch (error) {
      this.logger.error(`Failed to fetch company data: ${error}`);
      return this.getMockCompanies();
    }
  }

  /**
   * Look up company by unified business number (統一編號)
   */
  private async lookupByUnifiedBusinessNo(
    ubn: string,
  ): Promise<{ data: CompanyResult[]; total: number }> {
    const url = `${this.GCIS_BASE_URL}/6BM8-UPYP?$format=json&$filter=Business_Accounting_NO eq ${ubn}`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      this.logger.warn(`GCIS API returned ${response.status}`);
      return this.getMockCompanies();
    }

    const data: GcisCompanyBasic[] = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return { data: [], total: 0 };
    }

    return {
      data: data.map((company) => this.mapGcisToCompanyResult(company)),
      total: data.length,
    };
  }

  /**
   * Search companies by name
   */
  private async searchByCompanyName(
    name: string,
  ): Promise<{ data: CompanyResult[]; total: number }> {
    const url = `${this.GCIS_BASE_URL}/6BM8-UPYP?$format=json&$filter=Company_Name like ${encodeURIComponent(name)}&$top=20`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      this.logger.warn(`GCIS API returned ${response.status}`);
      return this.getMockCompanies();
    }

    const data: GcisCompanyBasic[] = await response.json();

    if (!Array.isArray(data)) {
      return { data: [], total: 0 };
    }

    return {
      data: data.map((company) => this.mapGcisToCompanyResult(company)),
      total: data.length,
    };
  }

  private mapGcisToCompanyResult(company: GcisCompanyBasic): CompanyResult {
    return {
      unifiedBusinessNo: company.Business_Accounting_NO,
      companyName: company.Company_Name,
      representative: company.Responsible_Name,
      address: company.Company_Location,
      capital: company.Capital_Stock_Amount,
      establishDate: this.formatDate(company.Company_Setup_Date),
      status: company.Company_Status_Desc,
      industry: [], // GCIS basic endpoint doesn't include industry data
    };
  }

  private formatDate(dateStr: string): string {
    if (!dateStr || dateStr.length !== 7) return dateStr;
    // Convert ROC year (e.g., 1130520) to ISO format
    const rocYear = parseInt(dateStr.substring(0, 3), 10);
    const month = dateStr.substring(3, 5);
    const day = dateStr.substring(5, 7);
    const adYear = rocYear + 1911;
    return `${adYear}-${month}-${day}`;
  }

  private getMockCompanies(): { data: CompanyResult[]; total: number } {
    return {
      data: [
        {
          unifiedBusinessNo: "12345678",
          companyName: "森騰營造股份有限公司",
          representative: "王大明",
          address: "臺北市中山區○○路123號",
          capital: 50000000,
          establishDate: "2010-05-20",
          status: "核准設立",
          industry: ["土木工程業", "建築工程業"],
        },
      ],
      total: 1,
    };
  }

  /**
   * 驗證公司統一編號
   */
  async verifyCompany(
    unifiedBusinessNo: string,
  ): Promise<CompanyResult | null> {
    const result = await this.searchCompanies({ unifiedBusinessNo });
    return result.data.length > 0 ? result.data[0] : null;
  }

  /**
   * 查詢建照歷史
   */
  async getBuildingPermitHistory(
    address: string,
  ): Promise<BuildingPermitResult[]> {
    const result = await this.searchBuildingPermits({ address });
    return result.data;
  }
}
