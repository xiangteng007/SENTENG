import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 勞動部 勞保局 API 服務
 *
 * 提供勞工保險、健保相關查詢功能
 *
 * @note 需申請 API 存取權限
 * 官方網站: https://www.bli.gov.tw/
 */

export interface NhiConfig {
  apiKey: string;
  apiHost: string;
  unitId: string; // 單位代碼
}

export interface LaborInsuranceRecord {
  employeeId: string;
  employeeName: string;
  nationalId: string;
  enrollmentDate: string;
  withdrawalDate?: string;
  insuranceGrade: number; // 投保級距
  premiumAmount: number;
  status: 'active' | 'withdrawn';
}

export interface HealthInsuranceRecord {
  employeeId: string;
  employeeName: string;
  cardNumber: string;
  dependents: number;
  premiumAmount: number;
  status: 'active' | 'suspended';
}

export interface PremiumCalculation {
  laborInsurance: {
    employerPremium: number;
    employeePremium: number;
    totalPremium: number;
    grade: number;
  };
  healthInsurance: {
    employerPremium: number;
    employeePremium: number;
    totalPremium: number;
    supplementaryPremium: number;
  };
  laborPension: {
    employerContribution: number;
    employeeContribution: number;
  };
}

@Injectable()
export class NhiApiService {
  private readonly logger = new Logger(NhiApiService.name);
  private readonly config: NhiConfig;

  // 2024 年費率
  private readonly RATES = {
    laborInsurance: 0.12, // 勞保費率 12%
    laborInsuranceEmployerRatio: 0.7, // 雇主負擔 70%
    laborInsuranceEmployeeRatio: 0.2, // 勞工負擔 20%
    employmentInsurance: 0.01, // 就業保險費率 1%
    healthInsurance: 0.0517, // 健保費率 5.17%
    healthInsuranceEmployerRatio: 0.6, // 雇主負擔 60%
    healthInsuranceEmployeeRatio: 0.3, // 勞工負擔 30%
    laborPension: 0.06, // 勞退提撥 6%
    supplementaryHealthInsurance: 0.0211, // 補充保費 2.11%
  };

  // 投保級距表 (2024)
  private readonly INSURANCE_GRADES = [
    { grade: 1, salary: 27470, minSalary: 0, maxSalary: 27470 },
    { grade: 2, salary: 28800, minSalary: 27471, maxSalary: 28800 },
    { grade: 3, salary: 30300, minSalary: 28801, maxSalary: 30300 },
    { grade: 4, salary: 31800, minSalary: 30301, maxSalary: 31800 },
    { grade: 5, salary: 33300, minSalary: 31801, maxSalary: 33300 },
    { grade: 6, salary: 34800, minSalary: 33301, maxSalary: 34800 },
    { grade: 7, salary: 36300, minSalary: 34801, maxSalary: 36300 },
    { grade: 8, salary: 38200, minSalary: 36301, maxSalary: 38200 },
    { grade: 9, salary: 40100, minSalary: 38201, maxSalary: 40100 },
    { grade: 10, salary: 42000, minSalary: 40101, maxSalary: 42000 },
    { grade: 11, salary: 43900, minSalary: 42001, maxSalary: 43900 },
    { grade: 12, salary: 45800, minSalary: 43901, maxSalary: 45800 },
  ];

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get<string>('NHI_API_KEY') || '',
      apiHost: this.configService.get<string>('NHI_API_HOST') || 'https://eservice.bli.gov.tw/api',
      unitId: this.configService.get<string>('NHI_UNIT_ID') || '',
    };
  }

  /**
   * 檢查 API 是否已設定
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.unitId);
  }

  /**
   * 根據薪資計算投保級距
   */
  getInsuranceGrade(monthlySalary: number): {
    grade: number;
    insurableSalary: number;
  } {
    const matched = this.INSURANCE_GRADES.find(
      g => monthlySalary >= g.minSalary && monthlySalary <= g.maxSalary
    );

    if (matched) {
      return { grade: matched.grade, insurableSalary: matched.salary };
    }

    // 超過最高級距
    const highest = this.INSURANCE_GRADES[this.INSURANCE_GRADES.length - 1];
    return { grade: highest.grade, insurableSalary: highest.salary };
  }

  /**
   * 計算勞健保費用
   */
  calculatePremiums(monthlySalary: number, dependents = 0): PremiumCalculation {
    const { insurableSalary, grade } = this.getInsuranceGrade(monthlySalary);

    // 勞保
    const laborInsuranceTotal = insurableSalary * this.RATES.laborInsurance;
    const laborInsuranceEmployer = laborInsuranceTotal * this.RATES.laborInsuranceEmployerRatio;
    const laborInsuranceEmployee = laborInsuranceTotal * this.RATES.laborInsuranceEmployeeRatio;

    // 健保
    const healthInsuranceTotal = insurableSalary * this.RATES.healthInsurance;
    const healthInsuranceEmployer = healthInsuranceTotal * this.RATES.healthInsuranceEmployerRatio;
    const healthInsuranceEmployee =
      healthInsuranceTotal * this.RATES.healthInsuranceEmployeeRatio * (1 + dependents * 0.3);

    // 補充保費 (月薪超過 4 倍投保金額時)
    let supplementaryPremium = 0;
    if (monthlySalary > insurableSalary * 4) {
      const excess = monthlySalary - insurableSalary * 4;
      supplementaryPremium = excess * this.RATES.supplementaryHealthInsurance;
    }

    // 勞退
    const laborPensionEmployer = monthlySalary * this.RATES.laborPension;
    const laborPensionEmployee = 0; // 勞工自提 (預設 0)

    return {
      laborInsurance: {
        employerPremium: Math.round(laborInsuranceEmployer),
        employeePremium: Math.round(laborInsuranceEmployee),
        totalPremium: Math.round(laborInsuranceTotal),
        grade,
      },
      healthInsurance: {
        employerPremium: Math.round(healthInsuranceEmployer),
        employeePremium: Math.round(healthInsuranceEmployee),
        totalPremium: Math.round(healthInsuranceTotal),
        supplementaryPremium: Math.round(supplementaryPremium),
      },
      laborPension: {
        employerContribution: Math.round(laborPensionEmployer),
        employeeContribution: Math.round(laborPensionEmployee),
      },
    };
  }

  /**
   * 批次計算員工保費
   */
  calculateBatchPremiums(employees: { id: string; salary: number; dependents: number }[]): {
    employees: { id: string; premiums: PremiumCalculation }[];
    totals: {
      totalEmployerCost: number;
      totalEmployeeCost: number;
    };
  } {
    let totalEmployerCost = 0;
    let totalEmployeeCost = 0;

    const results = employees.map(emp => {
      const premiums = this.calculatePremiums(emp.salary, emp.dependents);

      totalEmployerCost +=
        premiums.laborInsurance.employerPremium +
        premiums.healthInsurance.employerPremium +
        premiums.laborPension.employerContribution;

      totalEmployeeCost +=
        premiums.laborInsurance.employeePremium + premiums.healthInsurance.employeePremium;

      return { id: emp.id, premiums };
    });

    return {
      employees: results,
      totals: { totalEmployerCost, totalEmployeeCost },
    };
  }

  /**
   * 查詢勞保資料 (需 API 權限)
   */
  async queryLaborInsurance(nationalId: string): Promise<LaborInsuranceRecord | null> {
    if (!this.isConfigured()) {
      this.logger.warn('NHI API not configured');
      return null;
    }

    // TODO: Implement actual API call when credentials are available
    this.logger.log(`Querying labor insurance for ${nationalId.substring(0, 3)}***`);

    return null;
  }

  /**
   * 取得費率資訊
   */
  getRates(): typeof this.RATES {
    return { ...this.RATES };
  }

  /**
   * 取得投保級距表
   */
  getInsuranceGrades(): typeof this.INSURANCE_GRADES {
    return [...this.INSURANCE_GRADES];
  }
}
