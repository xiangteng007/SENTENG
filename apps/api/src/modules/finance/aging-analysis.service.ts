import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Invoice } from "../invoices/invoice.entity";

/**
 * Aging Analysis Service (帳齡分析服務)
 * ACC-ADV-003: 應收帳款帳齡分析報表
 *
 * 分析發票的帳齡分布，幫助財務管理現金流
 */

export interface AgingBucket {
  label: string;
  minDays: number;
  maxDays: number | null;
  count: number;
  totalAmount: number;
  invoices: AgingInvoice[];
}

export interface AgingInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  projectName: string;
  invoiceDate: Date;
  amount: number;
  balanceDue: number;
  daysOutstanding: number;
}

export interface AgingReport {
  asOfDate: Date;
  totalOutstanding: number;
  totalOverdue: number;
  overduePercentage: number;
  buckets: AgingBucket[];
  summary: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    over90: number;
  };
  riskAssessment: {
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
    criticalRisk: number;
  };
}

export interface AgingFilter {
  projectId?: string;
  clientId?: string;
  asOfDate?: Date;
  includePartiallyPaid?: boolean;
}

@Injectable()
export class AgingAnalysisService {
  // Aging buckets 定義 (30天為付款期限基準)
  private readonly AGING_BUCKETS = [
    { label: "未到期", minDays: -999999, maxDays: 30 },
    { label: "1-30天", minDays: 31, maxDays: 60 },
    { label: "31-60天", minDays: 61, maxDays: 90 },
    { label: "61-90天", minDays: 91, maxDays: 120 },
    { label: "90天以上", minDays: 121, maxDays: null },
  ];

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
  ) {}

  /**
   * 產生帳齡分析報表
   */
  async generateReport(filter: AgingFilter = {}): Promise<AgingReport> {
    const asOfDate = filter.asOfDate || new Date();

    // 查詢未完全付款的發票
    const queryBuilder = this.invoiceRepo
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.project", "project")
      .where("invoice.paymentStatus IN (:...statuses)", {
        statuses: ["UNPAID", "PARTIAL"],
      })
      .andWhere("invoice.deletedAt IS NULL");

    if (filter.projectId) {
      queryBuilder.andWhere("invoice.projectId = :projectId", {
        projectId: filter.projectId,
      });
    }

    if (filter.clientId) {
      queryBuilder.andWhere("invoice.clientId = :clientId", {
        clientId: filter.clientId,
      });
    }

    const invoices = await queryBuilder.getMany();

    // 計算每張發票的帳齡 (從開立日起算)
    const agingInvoices: AgingInvoice[] = invoices
      .map((inv) => {
        const invoiceDate = inv.invoiceDate
          ? new Date(inv.invoiceDate)
          : new Date();
        const daysOutstanding = Math.floor(
          (asOfDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        const balanceDue =
          Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0);

        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber || inv.invoiceNo || "N/A",
          customerName: inv.sellerName || "未指定",
          projectName: inv.project?.name || "未指定",
          invoiceDate: invoiceDate,
          amount: Number(inv.totalAmount || 0),
          balanceDue,
          daysOutstanding,
        };
      })
      .filter((inv) => inv.balanceDue > 0);

    // 分類到各個 bucket
    const buckets: AgingBucket[] = this.AGING_BUCKETS.map((bucket) => ({
      label: bucket.label,
      minDays: bucket.minDays,
      maxDays: bucket.maxDays,
      count: 0,
      totalAmount: 0,
      invoices: [],
    }));

    agingInvoices.forEach((inv) => {
      const bucketIndex = this.getBucketIndex(inv.daysOutstanding);
      buckets[bucketIndex].count++;
      buckets[bucketIndex].totalAmount += inv.balanceDue;
      buckets[bucketIndex].invoices.push(inv);
    });

    // 計算總計
    const totalOutstanding = agingInvoices.reduce(
      (sum, inv) => sum + inv.balanceDue,
      0,
    );
    const totalOverdue = agingInvoices
      .filter((inv) => inv.daysOutstanding > 30) // 超過30天視為逾期
      .reduce((sum, inv) => sum + inv.balanceDue, 0);

    return {
      asOfDate,
      totalOutstanding,
      totalOverdue,
      overduePercentage:
        totalOutstanding > 0 ? (totalOverdue / totalOutstanding) * 100 : 0,
      buckets,
      summary: {
        current: buckets[0].totalAmount,
        days1to30: buckets[1].totalAmount,
        days31to60: buckets[2].totalAmount,
        days61to90: buckets[3].totalAmount,
        over90: buckets[4].totalAmount,
      },
      riskAssessment: {
        lowRisk: buckets[0].totalAmount + buckets[1].totalAmount,
        mediumRisk: buckets[2].totalAmount,
        highRisk: buckets[3].totalAmount,
        criticalRisk: buckets[4].totalAmount,
      },
    };
  }

  /**
   * 取得特定帳齡區間的發票清單
   */
  async getInvoicesByAgingBucket(
    bucketLabel: string,
    filter: AgingFilter = {},
  ): Promise<AgingInvoice[]> {
    const report = await this.generateReport(filter);
    const bucket = report.buckets.find((b) => b.label === bucketLabel);
    return bucket?.invoices || [];
  }

  /**
   * 取得逾期摘要統計
   */
  async getOverdueSummary(filter: AgingFilter = {}): Promise<{
    totalOverdue: number;
    overdueCount: number;
    averageOverdueDays: number;
    oldestOverdueDays: number;
    topOverdueCustomers: Array<{ name: string; amount: number; count: number }>;
  }> {
    const report = await this.generateReport(filter);
    const overdueInvoices = report.buckets
      .filter((b) => b.minDays > 30)
      .flatMap((b) => b.invoices);

    // 按客戶分組
    const customerMap = new Map<string, { amount: number; count: number }>();
    overdueInvoices.forEach((inv) => {
      const existing = customerMap.get(inv.customerName) || {
        amount: 0,
        count: 0,
      };
      customerMap.set(inv.customerName, {
        amount: existing.amount + inv.balanceDue,
        count: existing.count + 1,
      });
    });

    const topOverdueCustomers = Array.from(customerMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalOverdue: report.totalOverdue,
      overdueCount: overdueInvoices.length,
      averageOverdueDays:
        overdueInvoices.length > 0
          ? Math.round(
              overdueInvoices.reduce(
                (sum, inv) => sum + inv.daysOutstanding,
                0,
              ) / overdueInvoices.length,
            )
          : 0,
      oldestOverdueDays:
        overdueInvoices.length > 0
          ? Math.max(...overdueInvoices.map((inv) => inv.daysOutstanding))
          : 0,
      topOverdueCustomers,
    };
  }

  /**
   * 判斷發票屬於哪個帳齡區間
   */
  private getBucketIndex(daysOutstanding: number): number {
    for (let i = 0; i < this.AGING_BUCKETS.length; i++) {
      const bucket = this.AGING_BUCKETS[i];
      if (
        daysOutstanding >= bucket.minDays &&
        (bucket.maxDays === null || daysOutstanding <= bucket.maxDays)
      ) {
        return i;
      }
    }
    return this.AGING_BUCKETS.length - 1;
  }
}
