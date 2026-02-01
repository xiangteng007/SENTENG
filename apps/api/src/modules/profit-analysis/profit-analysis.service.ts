import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Contract } from "../contracts/contract.entity";
import { PaymentApplication, PaymentReceipt } from "../payments/payment.entity";
import { CostEntry } from "../cost-entries/cost-entry.entity";
import { Invoice } from "../invoices/invoice.entity";
import { ChangeOrder } from "../change-orders/change-order.entity";

export interface ProjectProfitDto {
  projectId: string;
  contractAmount: number;
  changeOrderAmount: number;
  currentAmount: number;
  totalCost: number;
  grossProfit: number;
  marginRate: string;
  totalRequested: number;
  totalInvoiced: number;
  totalReceived: number;
  ar: number;
  ap: number;
}

export interface ProfitDashboardDto {
  totalContracts: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgMarginRate: string;
  projects: ProjectProfitDto[];
}

@Injectable()
export class ProfitAnalysisService {
  constructor(
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
    @InjectRepository(PaymentApplication)
    private paymentRepo: Repository<PaymentApplication>,
    @InjectRepository(PaymentReceipt)
    private receiptRepo: Repository<PaymentReceipt>,
    @InjectRepository(CostEntry)
    private costRepo: Repository<CostEntry>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(ChangeOrder)
    private changeOrderRepo: Repository<ChangeOrder>,
  ) {}

  /**
   * 取得單一專案的利潤分析
   */
  async getProjectProfit(projectId: string): Promise<ProjectProfitDto> {
    // 1. 合約資訊
    const contract = await this.contractRepo.findOne({
      where: { projectId },
    });

    const originalAmount = Number(contract?.originalAmount || 0);

    // 2. 累計變更金額
    const changeResult = await this.changeOrderRepo
      .createQueryBuilder("co")
      .select("SUM(co.net_change_amount)", "total")
      .where("co.project_id = :projectId", { projectId })
      .andWhere("co.status = :status", { status: "CHG_APPROVED" })
      .getRawOne();
    const changeOrderAmount = Number(changeResult?.total || 0);

    const currentAmount = originalAmount + changeOrderAmount;

    // 3. 已發生成本
    const costResult = await this.costRepo
      .createQueryBuilder("ce")
      .select("SUM(ce.amount)", "totalCost")
      .addSelect(
        "SUM(CASE WHEN ce.is_paid = false THEN ce.amount ELSE 0 END)",
        "unpaid",
      )
      .where("ce.project_id = :projectId", { projectId })
      .getRawOne();
    const totalCost = Number(costResult?.totalCost || 0);
    const ap = Number(costResult?.unpaid || 0);

    // 4. 已請款金額
    const requestResult = await this.paymentRepo
      .createQueryBuilder("pa")
      .select("SUM(pa.request_amount)", "total")
      .where("pa.project_id = :projectId", { projectId })
      .andWhere("pa.status IN (:...statuses)", {
        statuses: ["PAY_APPROVED", "PAY_INVOICED", "PAY_PARTIAL", "PAY_PAID"],
      })
      .getRawOne();
    const totalRequested = Number(requestResult?.total || 0);

    // 5. 已開票金額
    const invoiceResult = await this.invoiceRepo
      .createQueryBuilder("inv")
      .select("SUM(inv.amount)", "total")
      .where("inv.project_id = :projectId", { projectId })
      .andWhere("inv.status != :voided", { voided: "INV_VOIDED" })
      .getRawOne();
    const totalInvoiced = Number(invoiceResult?.total || 0);

    // 6. 已收款
    const receiptResult = await this.receiptRepo
      .createQueryBuilder("pr")
      .innerJoin("pr.application", "pa")
      .select("SUM(pr.amount)", "total")
      .where("pa.project_id = :projectId", { projectId })
      .getRawOne();
    const totalReceived = Number(receiptResult?.total || 0);

    // 7. 計算
    const grossProfit = currentAmount - totalCost;
    const marginRate =
      currentAmount > 0
        ? ((grossProfit / currentAmount) * 100).toFixed(2)
        : "0.00";
    const ar = totalInvoiced - totalReceived;

    return {
      projectId,
      contractAmount: originalAmount,
      changeOrderAmount,
      currentAmount,
      totalCost,
      grossProfit,
      marginRate,
      totalRequested,
      totalInvoiced,
      totalReceived,
      ar,
      ap,
    };
  }

  /**
   * 取得利潤分析儀表板 (所有專案)
   */
  async getDashboard(): Promise<ProfitDashboardDto> {
    // 取得所有進行中的合約
    const contracts = await this.contractRepo.find({
      where: { status: "CTR_ACTIVE" },
      select: ["projectId"],
    });

    const projects: ProjectProfitDto[] = [];
    let totalRevenue = 0;
    let totalCost = 0;

    for (const contract of contracts) {
      const profit = await this.getProjectProfit(contract.projectId);
      projects.push(profit);
      totalRevenue += profit.currentAmount;
      totalCost += profit.totalCost;
    }

    const totalProfit = totalRevenue - totalCost;
    const avgMarginRate =
      totalRevenue > 0
        ? ((totalProfit / totalRevenue) * 100).toFixed(2)
        : "0.00";

    return {
      totalContracts: contracts.length,
      totalRevenue,
      totalCost,
      totalProfit,
      avgMarginRate,
      projects,
    };
  }
}
