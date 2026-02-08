import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CostEntry } from "../../cost-entries/cost-entry.entity";
import { Invoice } from "../../invoices/invoice.entity";
import { WorkOrderCompletedEvent } from "../work-orders/events/work-order.events";

/**
 * WorkOrder 事件監聽器
 * 負責處理工單完工後的自動化流程：
 * 1. 建立成本明細 (CostEntry)
 * 2. 建立發票草稿 (Invoice)
 */
@Injectable()
export class WorkOrderEventListeners {
  private readonly logger = new Logger(WorkOrderEventListeners.name);

  constructor(
    @InjectRepository(CostEntry)
    private readonly costEntryRepo: Repository<CostEntry>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  /**
   * 工單完工事件處理
   * - 從服務目錄取得計價規則
   * - 計算實際成本（人工、設備折舊、藥劑等）
   * - 建立 CostEntry 記錄
   * - 建立 Invoice 草稿
   */
  @OnEvent("work-order.completed")
  async handleWorkOrderCompleted(
    event: WorkOrderCompletedEvent,
  ): Promise<void> {
    this.logger.log(
      `Processing work-order.completed for WO: ${event.workOrderId}`,
    );

    const { workOrder } = event;

    try {
      // 1. Create Cost Entries
      await this.createCostEntries(workOrder, event.completedAt);

      // 2. Create Invoice Draft
      await this.createInvoiceDraft(workOrder, event.completedAt);

      this.logger.log(
        `Successfully processed work-order.completed for WO: ${event.workOrderId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process work-order.completed for WO: ${event.workOrderId}`,
        error,
      );
      // In production, you might want to implement retry logic or dead letter queue
    }
  }

  private async createCostEntries(
    workOrder: {
      woNumber: string;
      projectId: string;
      estimatedDuration?: number;
      title?: string;
      woType?: string;
    },
    completedAt: Date,
  ): Promise<void> {
    // Generate cost entry ID
    const costEntryId = `CE-${workOrder.woNumber}-01`;

    // Calculate costs based on work order type and service
    // This is a simplified version - in production, you'd pull pricing from service_catalog
    const laborCost = workOrder.estimatedDuration
      ? workOrder.estimatedDuration * 10
      : 0; // $10 per minute

    const costEntry = this.costEntryRepo.create({
      id: costEntryId,
      projectId: workOrder.projectId,
      entryDate: completedAt,
      category: "DRONE_OPS",
      description: `工單 ${workOrder.woNumber}: ${workOrder.title || workOrder.woType}`,
      amount: laborCost,
      isPaid: false,
    });

    await this.costEntryRepo.save(costEntry);
    this.logger.log(`Created CostEntry: ${costEntryId}`);
  }

  private async createInvoiceDraft(
    workOrder: {
      woNumber: string;
      partnerId?: string;
      projectId?: string;
      estimatedDuration?: number;
      estimatedArea?: number;
      title?: string;
      woType?: string;
    },
    completedAt: Date,
  ): Promise<void> {
    // Check if partner exists
    if (!workOrder.partnerId) {
      this.logger.warn(
        `No partner associated with WO: ${workOrder.woNumber}, skipping invoice creation`,
      );
      return;
    }

    // Generate invoice number
    const now = new Date();
    const invoiceNo = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${workOrder.woNumber}`;

    // Calculate amount from service catalog
    // This is simplified - in production, use actual pricing rules
    const subtotal = workOrder.estimatedArea
      ? workOrder.estimatedArea * 50 // $50 per m2
      : workOrder.estimatedDuration
        ? workOrder.estimatedDuration * 20
        : 1000; // $20 per minute or default
    const taxRate = 0.05;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    const invoice = this.invoiceRepo.create({
      id: invoiceNo,
      invoiceNo: invoiceNo,
      projectId: workOrder.projectId,
      partnerId: workOrder.partnerId,
      docType: "INVOICE_B2B", // Changed from invoiceType to docType
      invoiceDate: completedAt,
      dueDate: new Date(completedAt.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      subtotal: subtotal,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
      paidAmount: 0,
      status: "INV_DRAFT",
      currentState: "DRAFT",
      notes: `工單 ${workOrder.woNumber}: ${workOrder.title || workOrder.woType}`,
    });

    await this.invoiceRepo.save(invoice);
    this.logger.log(`Created Invoice Draft: ${invoiceNo}`);
  }
}
