import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere } from "typeorm";
import { PaymentApplication, PaymentReceipt } from "./payment.entity";
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  CreateReceiptDto,
} from "./payment.dto";
import { ContractsService } from "../contracts/contracts.service";
import { FinanceService } from "../finance/finance.service";
import { isAdminRole } from "../../common/constants/roles";

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentApplication)
    private paymentsRepository: Repository<PaymentApplication>,
    @InjectRepository(PaymentReceipt)
    private receiptsRepository: Repository<PaymentReceipt>,
    private contractsService: ContractsService,
    private financeService: FinanceService,
  ) {}

  async findAll(
    options: { contractId?: string; projectId?: string; status?: string },
    userId?: string,
    userRole?: string,
  ): Promise<PaymentApplication[]> {
    const where: FindOptionsWhere<PaymentApplication> = {};
    if (options.contractId) where.contractId = options.contractId;
    if (options.projectId) where.projectId = options.projectId;
    if (options.status) where.status = options.status;

    const payments = await this.paymentsRepository.find({
      where,
      relations: ["contract", "project"],
      order: { periodNo: "ASC" },
    });

    // Filter by ownership for non-admin users
    if (userId && userRole && !isAdminRole(userRole)) {
      return payments.filter((p) => p.project?.createdBy === userId);
    }

    return payments;
  }

  async findOne(
    id: string,
    userId?: string,
    userRole?: string,
  ): Promise<PaymentApplication> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ["contract", "project"],
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }

    // Check ownership for non-admin users
    if (userId && userRole) {
      this.checkOwnership(payment, userId, userRole);
    }

    return payment;
  }

  /**
   * Check if user has access to payment via project ownership
   */
  private checkOwnership(
    payment: PaymentApplication,
    userId: string,
    userRole: string,
  ): void {
    if (isAdminRole(userRole)) return;

    if (payment.project?.createdBy !== userId) {
      throw new ForbiddenException("You do not have access to this payment");
    }
  }

  async create(
    dto: CreatePaymentDto,
    userId?: string,
  ): Promise<PaymentApplication> {
    // 取得合約
    const contract = await this.contractsService.findOne(dto.contractId);

    // 檢查合約狀態
    if (contract.status !== "CTR_ACTIVE") {
      throw new BadRequestException("只有執行中的合約可請款");
    }

    // 計算累計進度
    const previousPayments = await this.paymentsRepository.find({
      where: { contractId: dto.contractId },
      order: { periodNo: "DESC" },
    });

    const lastPayment = previousPayments[0];
    const previousCumulative = lastPayment
      ? Number(lastPayment.cumulativePercent)
      : 0;
    const cumulativePercent = previousCumulative + dto.progressPercent;

    // 驗證進度
    if (cumulativePercent > 100) {
      throw new BadRequestException("累計進度不可超過 100%");
    }

    // 計算金額
    const contractAmount = Number(contract.currentAmount);
    const retentionRate = Number(contract.retentionRate);
    const requestAmount = dto.requestAmount;
    const retentionAmount = requestAmount * (retentionRate / 100);
    const netAmount = requestAmount - retentionAmount;

    const id = await this.generateId();
    const periodNo = previousPayments.length + 1;

    const payment = this.paymentsRepository.create({
      id,
      contractId: dto.contractId,
      projectId: contract.projectId,
      periodNo,
      applicationDate: new Date(dto.applicationDate),
      progressPercent: dto.progressPercent,
      cumulativePercent,
      requestAmount,
      retentionAmount,
      netAmount,
      notes: dto.notes,
      status: "PAY_DRAFT",
    });

    return this.paymentsRepository.save(payment);
  }

  async update(
    id: string,
    dto: UpdatePaymentDto,
    userId?: string,
  ): Promise<PaymentApplication> {
    const payment = await this.findOne(id);

    if (payment.lockedAt) {
      throw new ForbiddenException({ code: "LOCKED", message: "請款單已鎖定" });
    }

    if (dto.requestAmount !== undefined) {
      const contract = await this.contractsService.findOne(payment.contractId);
      const retentionRate = Number(contract.retentionRate);
      const retentionAmount = dto.requestAmount * (retentionRate / 100);
      (payment as any).retentionAmount = retentionAmount;
      (payment as any).netAmount = dto.requestAmount - retentionAmount;
    }

    Object.assign(payment, dto);
    return this.paymentsRepository.save(payment);
  }

  async submit(id: string, userId?: string): Promise<PaymentApplication> {
    const payment = await this.findOne(id);

    if (payment.status !== "PAY_DRAFT") {
      throw new BadRequestException("只有草稿狀態可提交");
    }
    if (payment.requestAmount <= 0) {
      throw new BadRequestException("請款金額必須大於 0");
    }

    payment.status = "PAY_PENDING";
    return this.paymentsRepository.save(payment);
  }

  async approve(id: string, userId?: string): Promise<PaymentApplication> {
    const payment = await this.findOne(id);

    if (payment.status !== "PAY_PENDING") {
      throw new BadRequestException("只有待審核狀態可核准");
    }

    payment.status = "PAY_APPROVED";
    payment.lockedAt = new Date();
    if (userId) payment.lockedBy = userId;
    return this.paymentsRepository.save(payment);
  }

  async reject(
    id: string,
    reason: string,
    userId?: string,
  ): Promise<PaymentApplication> {
    const payment = await this.findOne(id);

    if (payment.status !== "PAY_PENDING") {
      throw new BadRequestException("只有待審核狀態可駁回");
    }

    payment.status = "PAY_DRAFT";
    payment.notes = `[駁回] ${reason}\n${payment.notes || ""}`;
    return this.paymentsRepository.save(payment);
  }

  async addReceipt(
    dto: CreateReceiptDto,
    userId?: string,
  ): Promise<PaymentReceipt> {
    const payment = await this.findOne(dto.applicationId);

    if (payment.status !== "PAY_APPROVED") {
      throw new BadRequestException("只有已核准的請款單可登記收款");
    }

    const id = `${dto.applicationId}-R${String(Date.now()).slice(-4)}`;

    const receipt = this.receiptsRepository.create({
      id,
      applicationId: dto.applicationId,
      receiptDate: new Date(dto.receiptDate),
      amount: dto.amount,
      paymentMethod: dto.paymentMethod || "BANK_TRANSFER",
      referenceNo: dto.referenceNo,
      notes: dto.notes,
    });

    await this.receiptsRepository.save(receipt);

    // 更新請款單已收金額
    const totalReceived = Number(payment.receivedAmount) + dto.amount;
    payment.receivedAmount = totalReceived;

    if (totalReceived >= Number(payment.netAmount)) {
      payment.status = "PAY_PAID";
    }

    await this.paymentsRepository.save(payment);

    // 自動建立財務交易記錄 (收入)
    await this.financeService.createTransactionFromSource({
      type: "收入",
      amount: dto.amount,
      date: new Date(dto.receiptDate),
      category: "專案收款",
      description: `請款單 ${payment.id} 期別 ${payment.periodNo} 收款`,
      projectId: payment.projectId,
      referenceType: "PAYMENT_RECEIPT",
      referenceId: id,
      createdBy: userId,
    });

    return receipt;
  }

  async getReceipts(applicationId: string): Promise<PaymentReceipt[]> {
    return this.receiptsRepository.find({
      where: { applicationId },
      order: { receiptDate: "DESC" },
    });
  }

  private async generateId(): Promise<string> {
    const date = new Date();
    const prefix = `PAY-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-`;

    const last = await this.paymentsRepository
      .createQueryBuilder("p")
      .where("p.id LIKE :prefix", { prefix: `${prefix}%` })
      .orderBy("p.id", "DESC")
      .getOne();

    let seq = 1;
    if (last) {
      const lastSeq = parseInt(last.id.split("-")[2], 10);
      seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(4, "0")}`;
  }

  /**
   * Export payment applications to Excel/CSV
   */
  async exportToExcel(
    options: {
      contractId?: string;
      projectId?: string;
      status?: string;
      format?: "xlsx" | "csv";
    },
    userId?: string,
    userRole?: string,
  ): Promise<Buffer> {
    const ExcelJS = await import("exceljs");
    const { contractId, projectId, status, format = "xlsx" } = options;

    const payments = await this.findAll(
      { contractId, projectId, status },
      userId,
      userRole,
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Payments");

    sheet.columns = [
      { header: "請款編號", key: "id", width: 20 },
      { header: "專案名稱", key: "projectName", width: 25 },
      { header: "期別", key: "periodNo", width: 8 },
      { header: "申請日期", key: "applicationDate", width: 15 },
      { header: "進度%", key: "progressPercent", width: 10 },
      { header: "累計%", key: "cumulativePercent", width: 10 },
      { header: "請款金額", key: "requestAmount", width: 15 },
      { header: "保留款", key: "retentionAmount", width: 15 },
      { header: "淨額", key: "netAmount", width: 15 },
      { header: "已收金額", key: "receivedAmount", width: 15 },
      { header: "狀態", key: "status", width: 15 },
    ];

    for (const p of payments) {
      sheet.addRow({
        id: p.id,
        projectName: p.project?.name || "",
        periodNo: p.periodNo,
        applicationDate: p.applicationDate
          ? new Date(p.applicationDate).toLocaleDateString("zh-TW")
          : "",
        progressPercent: p.progressPercent,
        cumulativePercent: p.cumulativePercent,
        requestAmount: p.requestAmount,
        retentionAmount: p.retentionAmount,
        netAmount: p.netAmount,
        receivedAmount: p.receivedAmount,
        status: p.status,
      });
    }

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    if (format === "csv") {
      return Buffer.from(await workbook.csv.writeBuffer());
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
