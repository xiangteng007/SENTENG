import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { Invoice } from "./invoice.entity";
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  QueryInvoiceDto,
  InvoiceStatsDto,
  InvoiceState,
  PaymentStatus,
  VatDeductibleStatus,
} from "./invoice.dto";
import { v4 as uuidv4 } from "uuid";
import { isAdminRole } from "../../common/constants/roles";

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
  ) {}

  /**
   * 查詢發票列表 (支援篩選、分頁、搜尋)
   */
  async findAll(
    query: QueryInvoiceDto,
    userId?: string,
    userRole?: string,
  ): Promise<{ data: Invoice[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    try {
      const qb = this.invoicesRepository
        .createQueryBuilder("invoice")
        .leftJoinAndSelect("invoice.project", "project")
        .leftJoinAndSelect("invoice.vendor", "vendor")
        .leftJoinAndSelect("invoice.client", "client");

      // 搜尋
      if (query.search) {
        qb.andWhere(
          "(invoice.sellerName ILIKE :search OR invoice.invoiceNumber ILIKE :search OR invoice.sellerTaxId ILIKE :search OR invoice.description ILIKE :search)",
          { search: `%${query.search}%` },
        );
      }

      // 篩選條件
      if (query.docType) {
        qb.andWhere("invoice.docType = :docType", { docType: query.docType });
      }
      if (query.currentState) {
        qb.andWhere("invoice.currentState = :currentState", {
          currentState: query.currentState,
        });
      }
      if (query.paymentStatus) {
        qb.andWhere("invoice.paymentStatus = :paymentStatus", {
          paymentStatus: query.paymentStatus,
        });
      }
      if (query.vatDeductibleStatus) {
        qb.andWhere("invoice.vatDeductibleStatus = :vatDeductibleStatus", {
          vatDeductibleStatus: query.vatDeductibleStatus,
        });
      }
      if (query.projectId) {
        qb.andWhere("invoice.projectId = :projectId", {
          projectId: query.projectId,
        });
      }
      if (query.vendorId) {
        qb.andWhere("invoice.partnerId = :partnerId", {
          partnerId: query.vendorId,
        });
      }
      if (query.invoicePeriod) {
        qb.andWhere("invoice.invoicePeriod = :invoicePeriod", {
          invoicePeriod: query.invoicePeriod,
        });
      }
      if (query.dateFrom) {
        qb.andWhere("invoice.invoiceDate >= :dateFrom", {
          dateFrom: query.dateFrom,
        });
      }
      if (query.dateTo) {
        qb.andWhere("invoice.invoiceDate <= :dateTo", { dateTo: query.dateTo });
      }
      if (query.amountMin !== undefined) {
        qb.andWhere("invoice.amountGross >= :amountMin", {
          amountMin: query.amountMin,
        });
      }
      if (query.amountMax !== undefined) {
        qb.andWhere("invoice.amountGross <= :amountMax", {
          amountMax: query.amountMax,
        });
      }
      if (query.aiNeedsReview !== undefined) {
        qb.andWhere("invoice.aiNeedsReview = :aiNeedsReview", {
          aiNeedsReview: query.aiNeedsReview,
        });
      }

      // IDOR Protection: Non-admin users see only invoices they created
      if (userId && userRole && !isAdminRole(userRole)) {
        qb.andWhere("invoice.createdBy = :userId", { userId });
      }

      // 軟刪除
      qb.andWhere("invoice.deletedAt IS NULL");

      // 排序與分頁
      qb.orderBy("invoice.createdAt", "DESC").skip(skip).take(limit);

      const [data, total] = await qb.getManyAndCount();

      return { data, total, page, limit };
    } catch (error) {
      this.logger.error("findAll error:", error);
      // Return empty result on error to prevent 500
      return { data: [], total: 0, page, limit };
    }
  }

  /**
   * 取得單一發票
   */
  async findOne(
    id: string,
    userId?: string,
    userRole?: string,
  ): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ["project", "contract", "client", "vendor"],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    // IDOR Protection: Check ownership for non-admin users
    this.checkOwnership(invoice, userId, userRole);

    return invoice;
  }

  /**
   * 建立發票
   */
  async create(dto: CreateInvoiceDto, userId?: string): Promise<Invoice> {
    const id = uuidv4();

    // 計算金額
    let amountNet = dto.amountNet || dto.subtotal || 0;
    let amountTax = dto.amountTax || dto.taxAmount || 0;
    let amountGross = dto.amountGross || dto.totalAmount || 0;
    const vatRate = dto.vatRate || 0.05;

    // 自動計算 (如果只提供含稅)
    if (amountGross > 0 && amountNet === 0) {
      amountNet = Math.round(amountGross / (1 + vatRate));
      amountTax = amountGross - amountNet;
    } else if (amountNet > 0 && amountGross === 0) {
      amountTax = Math.round(amountNet * vatRate);
      amountGross = amountNet + amountTax;
    }

    // 計算發票期別
    let invoicePeriod = dto.invoicePeriod;
    if (!invoicePeriod && dto.invoiceDate) {
      const d = new Date(dto.invoiceDate);
      const month = d.getMonth() + 1;
      const periodEnd = Math.ceil(month / 2) * 2;
      const periodStart = periodEnd - 1;
      invoicePeriod = `${periodStart}-${periodEnd}`;
    }

    // 自動判斷進項扣抵狀態
    let vatDeductibleStatus =
      dto.vatDeductibleStatus || VatDeductibleStatus.UNKNOWN;
    if (dto.docType === "INVOICE_B2B" || dto.docType === "INVOICE_EGUI") {
      if (
        dto.buyerTaxId &&
        vatDeductibleStatus === VatDeductibleStatus.UNKNOWN
      ) {
        vatDeductibleStatus = VatDeductibleStatus.ELIGIBLE;
      }
    } else if (dto.docType === "INVOICE_B2C" || dto.docType === "RECEIPT") {
      vatDeductibleStatus = VatDeductibleStatus.INELIGIBLE;
    }

    const invoice = this.invoicesRepository.create({
      id,
      docType: dto.docType || "INVOICE_B2B",
      sourceType: dto.sourceType || "MANUAL",
      invoiceTrack: dto.invoiceTrack,
      invoiceNumber: dto.invoiceNumber,
      invoiceNo:
        dto.invoiceNo || `${dto.invoiceTrack || ""}${dto.invoiceNumber || ""}`,
      invoicePeriod,
      invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : new Date(),
      randomCode: dto.randomCode,
      sellerTaxId: dto.sellerTaxId,
      sellerName: dto.sellerName,
      buyerTaxId: dto.buyerTaxId,
      currency: dto.currency || "TWD",
      fxRate: dto.fxRate || 1,
      amountNet,
      amountTax,
      amountGross,
      vatRate,
      subtotal: amountNet,
      taxRate: vatRate * 100,
      taxAmount: amountTax,
      totalAmount: amountGross,
      vatDeductibleStatus,
      vatClaimPeriod: dto.vatClaimPeriod,
      retainageRate: dto.retainageRate || 0,
      retainageAmount: dto.retainageAmount || 0,
      currentState: dto.currentState || InvoiceState.DRAFT,
      approvalStatus: "DRAFT",
      paymentStatus: dto.paymentStatus || PaymentStatus.UNPAID,
      status: "INV_DRAFT",
      aiConfidence: dto.aiConfidence,
      aiNeedsReview: dto.aiNeedsReview || false,
      projectId: dto.projectId,
      contractId: dto.contractId,
      clientId: dto.clientId,
      vendorId: dto.vendorId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      costCategory: dto.costCategory,
      costCodeId: dto.costCodeId,
      description: dto.description,
      notes: dto.notes,
      tags: dto.tags,
      primaryFileId: dto.primaryFileId,
      thumbnailUrl: dto.thumbnailUrl,
      createdBy: userId,
    });

    return this.invoicesRepository.save(invoice);
  }

  /**
   * 更新發票
   */
  async update(
    id: string,
    dto: UpdateInvoiceDto,
    userId?: string,
    userRole?: string,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id, userId, userRole);
    // DTO string dates vs entity Date types — runtime coercion handled by Object.assign + save
    const updateData = dto as any;

    // 只有草稿/待覆核狀態可修改基本資訊
    const editableStates = [
      InvoiceState.DRAFT,
      InvoiceState.NEEDS_REVIEW,
      InvoiceState.REVIEWED,
    ];
    if (!editableStates.includes(invoice.currentState as InvoiceState)) {
      // 允許更新狀態相關欄位
      const allowedFields = [
        "currentState",
        "approvalStatus",
        "paymentStatus",
        "vatDeductibleStatus",
        "paidAmount",
      ];
      const updateKeys = Object.keys(dto);
      const hasDisallowedFields = updateKeys.some(
        (k) => !allowedFields.includes(k),
      );
      if (hasDisallowedFields) {
        throw new BadRequestException("此狀態下只能更新狀態欄位");
      }
    }

    // 更新金額計算
    if (
      updateData.amountNet !== undefined ||
      updateData.amountGross !== undefined
    ) {
      const vatRate = updateData.vatRate ?? invoice.vatRate;
      if (updateData.amountGross && !updateData.amountNet) {
        updateData.amountNet = Math.round(
          updateData.amountGross / (1 + vatRate),
        );
        updateData.amountTax = updateData.amountGross - updateData.amountNet;
      } else if (updateData.amountNet && !updateData.amountGross) {
        updateData.amountTax = Math.round(updateData.amountNet * vatRate);
        updateData.amountGross = updateData.amountNet + updateData.amountTax;
      }
    }

    // 更新欄位
    Object.assign(invoice, updateData);

    // 同步舊欄位
    if (updateData.amountNet !== undefined)
      invoice.subtotal = updateData.amountNet;
    if (updateData.amountTax !== undefined)
      invoice.taxAmount = updateData.amountTax;
    if (updateData.amountGross !== undefined)
      invoice.totalAmount = updateData.amountGross;

    return this.invoicesRepository.save(invoice);
  }

  /**
   * 變更狀態
   */
  async changeState(
    id: string,
    newState: InvoiceState,
    userId?: string,
    userRole?: string,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id, userId, userRole);

    // 狀態轉換驗證
    const validTransitions: Record<string, string[]> = {
      [InvoiceState.DRAFT]: [InvoiceState.UPLOADED],
      [InvoiceState.UPLOADED]: [
        InvoiceState.AI_EXTRACTED,
        InvoiceState.REVIEWED,
      ],
      [InvoiceState.AI_EXTRACTED]: [
        InvoiceState.NEEDS_REVIEW,
        InvoiceState.REVIEWED,
      ],
      [InvoiceState.NEEDS_REVIEW]: [InvoiceState.REVIEWED],
      [InvoiceState.REVIEWED]: [
        InvoiceState.ASSIGNED,
        InvoiceState.PENDING_APPROVAL,
      ],
      [InvoiceState.ASSIGNED]: [InvoiceState.PENDING_APPROVAL],
      [InvoiceState.PENDING_APPROVAL]: [
        InvoiceState.APPROVED,
        InvoiceState.REJECTED,
      ],
      [InvoiceState.APPROVED]: [
        InvoiceState.PAYABLE_SCHEDULED,
        InvoiceState.PAID,
      ],
      [InvoiceState.REJECTED]: [InvoiceState.DRAFT, InvoiceState.REVIEWED],
      [InvoiceState.PAYABLE_SCHEDULED]: [InvoiceState.PAID],
      [InvoiceState.PAID]: [InvoiceState.VAT_CLAIMED],
    };

    const currentState = invoice.currentState;
    if (!validTransitions[currentState]?.includes(newState)) {
      throw new BadRequestException(
        `不允許從 ${currentState} 轉換到 ${newState}`,
      );
    }

    invoice.currentState = newState;

    // 同步相關狀態
    if (newState === InvoiceState.APPROVED) {
      invoice.approvalStatus = "APPROVED";
    } else if (newState === InvoiceState.REJECTED) {
      invoice.approvalStatus = "REJECTED";
    } else if (newState === InvoiceState.PENDING_APPROVAL) {
      invoice.approvalStatus = "PENDING";
    } else if (newState === InvoiceState.PAID) {
      invoice.paymentStatus = PaymentStatus.PAID;
      invoice.paidAmount = invoice.amountGross;
    } else if (newState === InvoiceState.VAT_CLAIMED) {
      invoice.vatDeductibleStatus = VatDeductibleStatus.CLAIMED;
    }

    return this.invoicesRepository.save(invoice);
  }

  /**
   * 記錄付款
   */
  async recordPayment(
    id: string,
    amount: number,
    userId?: string,
    userRole?: string,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id, userId, userRole);

    if (
      invoice.currentState !== InvoiceState.APPROVED &&
      invoice.currentState !== InvoiceState.PAYABLE_SCHEDULED
    ) {
      throw new BadRequestException("只有已核准的發票可記錄付款");
    }

    const newPaidAmount = Number(invoice.paidAmount || 0) + amount;
    invoice.paidAmount = newPaidAmount;

    if (newPaidAmount >= Number(invoice.amountGross)) {
      invoice.paymentStatus = PaymentStatus.PAID;
      invoice.currentState = InvoiceState.PAID;
    } else if (newPaidAmount > 0) {
      invoice.paymentStatus = PaymentStatus.PARTIAL;
    }

    return this.invoicesRepository.save(invoice);
  }

  /**
   * 作廢發票
   */
  async void(
    id: string,
    reason: string,
    userId?: string,
    userRole?: string,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id, userId, userRole);

    if (invoice.currentState === InvoiceState.VOIDED) {
      throw new BadRequestException("發票已作廢");
    }

    invoice.currentState = InvoiceState.VOIDED;
    invoice.status = "INV_VOID";
    invoice.notes = `[作廢原因] ${reason}\n${invoice.notes || ""}`;

    return this.invoicesRepository.save(invoice);
  }

  /**
   * 軟刪除
   */
  async softDelete(
    id: string,
    userId?: string,
    userRole?: string,
  ): Promise<void> {
    const invoice = await this.findOne(id, userId, userRole);
    invoice.deletedAt = new Date();
    await this.invoicesRepository.save(invoice);
  }

  /**
   * 取得統計數據
   */
  async getStats(userId?: string, userRole?: string): Promise<InvoiceStatsDto> {
    try {
      const qb = this.invoicesRepository
        .createQueryBuilder("invoice")
        .select([
          "invoice.id",
          "invoice.currentState",
          "invoice.paymentStatus",
          "invoice.vatDeductibleStatus",
          "invoice.amountNet",
          "invoice.amountTax",
          "invoice.amountGross",
        ])
        .where("invoice.deletedAt IS NULL");

      // IDOR Protection
      if (userId && userRole && !isAdminRole(userRole)) {
        qb.andWhere("invoice.createdBy = :userId", { userId });
      }

      const all = await qb.getMany();

      const stats: InvoiceStatsDto = {
        totalCount: all.length,
        totalAmountNet: all.reduce(
          (sum, i) => sum + Number(i.amountNet || 0),
          0,
        ),
        totalAmountTax: all.reduce(
          (sum, i) => sum + Number(i.amountTax || 0),
          0,
        ),
        totalAmountGross: all.reduce(
          (sum, i) => sum + Number(i.amountGross || 0),
          0,
        ),
        byState: {},
        byPaymentStatus: {},
        byVatStatus: {},
        needsReviewCount: all.filter(
          (i) => i.currentState === InvoiceState.NEEDS_REVIEW,
        ).length,
        pendingApprovalCount: all.filter(
          (i) => i.currentState === InvoiceState.PENDING_APPROVAL,
        ).length,
        unpaidCount: all.filter(
          (i) =>
            i.paymentStatus === PaymentStatus.UNPAID &&
            i.currentState === InvoiceState.APPROVED,
        ).length,
      };

      // 按狀態統計
      for (const invoice of all) {
        const state = invoice.currentState || "UNKNOWN";
        const payStatus = invoice.paymentStatus || "UNKNOWN";
        const vatStatus = invoice.vatDeductibleStatus || "UNKNOWN";
        stats.byState[state] = (stats.byState[state] || 0) + 1;
        stats.byPaymentStatus[payStatus] =
          (stats.byPaymentStatus[payStatus] || 0) + 1;
        stats.byVatStatus[vatStatus] = (stats.byVatStatus[vatStatus] || 0) + 1;
      }

      return stats;
    } catch (error) {
      this.logger.error("getStats error:", error);
      // Return empty stats on error to prevent 500
      return {
        totalCount: 0,
        totalAmountNet: 0,
        totalAmountTax: 0,
        totalAmountGross: 0,
        byState: {},
        byPaymentStatus: {},
        byVatStatus: {},
        needsReviewCount: 0,
        pendingApprovalCount: 0,
        unpaidCount: 0,
      };
    }
  }

  /**
   * 本月統計
   */
  async getMonthlyStats(
    year: number,
    month: number,
    userId?: string,
    userRole?: string,
  ): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const qb = this.invoicesRepository
      .createQueryBuilder("invoice")
      .where("invoice.deletedAt IS NULL")
      .andWhere("invoice.invoiceDate >= :startDate", { startDate })
      .andWhere("invoice.invoiceDate <= :endDate", { endDate });

    if (userId && userRole && !isAdminRole(userRole)) {
      qb.andWhere("invoice.createdBy = :userId", { userId });
    }

    const invoices = await qb.getMany();

    return {
      year,
      month,
      count: invoices.length,
      totalNet: invoices.reduce((sum, i) => sum + Number(i.amountNet || 0), 0),
      totalTax: invoices.reduce((sum, i) => sum + Number(i.amountTax || 0), 0),
      totalGross: invoices.reduce(
        (sum, i) => sum + Number(i.amountGross || 0),
        0,
      ),
      eligibleCount: invoices.filter(
        (i) => i.vatDeductibleStatus === VatDeductibleStatus.ELIGIBLE,
      ).length,
      eligibleTax: invoices
        .filter((i) => i.vatDeductibleStatus === VatDeductibleStatus.ELIGIBLE)
        .reduce((sum, i) => sum + Number(i.amountTax || 0), 0),
    };
  }

  /**
   * IDOR Protection: Verify user has access to the invoice
   */
  private checkOwnership(
    invoice: Invoice,
    userId?: string,
    userRole?: string,
  ): void {
    if (!userId || !userRole) return;
    if (isAdminRole(userRole)) return;

    if (invoice.createdBy !== userId) {
      throw new ForbiddenException("You do not have access to this invoice");
    }
  }
}
