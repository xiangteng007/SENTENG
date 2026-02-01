/**
 * Banking Integration Service
 *
 * Interfaces with Taiwan banking systems:
 * - Virtual Account Generation
 * - Batch Transfer API
 */

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface VirtualAccountRequest {
  projectId: string;
  customerId: string;
  amount: number;
  dueDate: string;
  description?: string;
}

export interface VirtualAccountResult {
  virtualAccountNo: string;
  bankCode: string;
  bankName: string;
  amount: number;
  dueDate: string;
  qrCodeData: string;
  barcodeData: string;
  createdAt: string;
  expiresAt: string;
}

export interface BatchTransferEntry {
  recipientName: string;
  recipientAccount: string;
  bankCode: string;
  amount: number;
  reference: string;
  memo?: string;
}

export interface BatchTransferRequest {
  batchId: string;
  paymentDate: string;
  entries: BatchTransferEntry[];
}

export interface BatchTransferResult {
  batchId: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalAmount: number;
  entryCount: number;
  successCount: number;
  failedCount: number;
  submittedAt: string;
  processedAt?: string;
  errors?: { index: number; error: string }[];
}

export interface BankBalance {
  accountNo: string;
  bankName: string;
  balance: number;
  availableBalance: number;
  currency: string;
  lastUpdated: string;
}

@Injectable()
export class BankingIntegrationService {
  private readonly logger = new Logger(BankingIntegrationService.name);
  private readonly bankApiKey: string;
  private readonly merchantId: string;

  constructor(private readonly configService: ConfigService) {
    this.bankApiKey = this.configService.get("BANK_API_KEY", "");
    this.merchantId = this.configService.get("BANK_MERCHANT_ID", "");
  }

  /**
   * 產生虛擬帳號
   */
  async generateVirtualAccount(
    request: VirtualAccountRequest,
  ): Promise<VirtualAccountResult> {
    this.logger.log(
      `Generating virtual account for project: ${request.projectId}`,
    );

    // @future(BANK-001): Implement actual bank API integration
    // Providers: 玉山銀行 eSun, 中國信託 CTBC, 永豐銀行 SinoPac
    // Status: Pending bank API credentials

    const virtualAccountNo = `${this.merchantId}${Date.now().toString().slice(-10)}`;

    return {
      virtualAccountNo,
      bankCode: "808",
      bankName: "玉山銀行",
      amount: request.amount,
      dueDate: request.dueDate,
      qrCodeData: `TWQRP://TWQRP?VA=${virtualAccountNo}&AMT=${request.amount}`,
      barcodeData: `9${virtualAccountNo.padStart(14, "0")}${request.amount.toString().padStart(8, "0")}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(
        new Date(request.dueDate).getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };
  }

  /**
   * 查詢虛擬帳號收款狀態
   */
  async checkVirtualAccountPayment(virtualAccountNo: string): Promise<{
    paid: boolean;
    paidAmount?: number;
    paidAt?: string;
    payerAccount?: string;
  }> {
    this.logger.log(`Checking payment status for: ${virtualAccountNo}`);

    // @future(BANK-002): Implement actual bank API query for payment status
    return {
      paid: false,
    };
  }

  /**
   * 批次轉帳
   */
  async submitBatchTransfer(
    request: BatchTransferRequest,
  ): Promise<BatchTransferResult> {
    this.logger.log(
      `Submitting batch transfer: ${request.batchId} with ${request.entries.length} entries`,
    );

    // @future(BANK-003): Implement actual bank API integration for batch transfers
    // Formats: 財金公司 ACH, 各銀行專屬 API

    const totalAmount = request.entries.reduce((sum, e) => sum + e.amount, 0);

    return {
      batchId: request.batchId,
      status: "pending",
      totalAmount,
      entryCount: request.entries.length,
      successCount: 0,
      failedCount: 0,
      submittedAt: new Date().toISOString(),
    };
  }

  /**
   * 查詢批次轉帳狀態
   */
  async getBatchTransferStatus(batchId: string): Promise<BatchTransferResult> {
    this.logger.log(`Getting batch transfer status: ${batchId}`);

    // @future(BANK-004): Implement actual bank API query for batch status
    return {
      batchId,
      status: "pending",
      totalAmount: 0,
      entryCount: 0,
      successCount: 0,
      failedCount: 0,
      submittedAt: new Date().toISOString(),
    };
  }

  /**
   * 查詢帳戶餘額
   */
  async getAccountBalance(accountNo: string): Promise<BankBalance> {
    this.logger.log(`Getting account balance for: ${accountNo}`);

    // @future(BANK-005): Implement actual bank API query for balance
    return {
      accountNo,
      bankName: "玉山銀行",
      balance: 0,
      availableBalance: 0,
      currency: "TWD",
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 產生付款通知 (超商代收)
   */
  async generatePaymentBarcode(
    amount: number,
    dueDate: string,
    reference: string,
  ): Promise<{
    barcode1: string;
    barcode2: string;
    barcode3: string;
    expiresAt: string;
  }> {
    this.logger.log(`Generating payment barcode for amount: ${amount}`);

    // @future(CVS-001): Implement convenience store payment integration
    // Providers: 7-11 ibon, 全家 FamiPort, 萊爾富 Life-ET

    return {
      barcode1: `9${this.merchantId.padStart(4, "0")}`,
      barcode2: reference.padStart(16, "0"),
      barcode3: `${amount.toString().padStart(8, "0")}${dueDate.replace(/-/g, "")}`,
      expiresAt: dueDate,
    };
  }
}
