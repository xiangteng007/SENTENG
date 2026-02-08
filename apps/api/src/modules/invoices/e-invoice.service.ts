/**
 * E-Invoice Service (電子發票服務)
 *
 * 支援 ECPay (綠界) 和 ezPay (藍新) 電子發票 API
 * 預設使用 ECPay，可透過環境變數切換
 */

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import * as crypto from "crypto";

export interface InvoiceIssueDto {
  /** 買受人統編 (可選，個人免填) */
  buyerIdentifier?: string;
  /** 買受人名稱 */
  buyerName: string;
  /** 買受人email (可選) */
  buyerEmail?: string;
  /** 發票金額 */
  amount: number;
  /** 稅額 (預設 5%) */
  tax?: number;
  /** 商品明細 */
  items: InvoiceItemDto[];
  /** 載具類型: 1=會員載具, 2=手機條碼, 3=自然人憑證 */
  carrierType?: number;
  /** 載具編號 */
  carrierNum?: string;
  /** 捐贈愛心碼 */
  loveCode?: string;
  /** 備註 */
  comment?: string;
  /** 關聯的內部訂單ID */
  orderId?: string;
}

export interface InvoiceItemDto {
  /** 商品名稱 */
  name: string;
  /** 數量 */
  quantity: number;
  /** 單價 */
  unitPrice: number;
  /** 單位 */
  unit?: string;
}

export interface InvoiceResult {
  success: boolean;
  /** 發票號碼 (格式: XX-12345678) */
  invoiceNumber?: string;
  /** 發票開立日期 */
  invoiceDate?: string;
  /** 隨機碼 */
  randomNumber?: string;
  /** 錯誤訊息 */
  errorMessage?: string;
  /** 原始回應 */
  rawResponse?: Record<string, unknown>;
}

export interface InvoiceVoidDto {
  invoiceNumber: string;
  voidReason: string;
}

@Injectable()
export class EInvoiceService {
  private readonly logger = new Logger(EInvoiceService.name);
  private readonly provider: "ecpay" | "ezpay";
  private readonly apiClient: AxiosInstance;
  private readonly merchantId: string;
  private readonly hashKey: string;
  private readonly hashIV: string;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.provider = this.configService.get("EINVOICE_PROVIDER", "ecpay");
    this.merchantId = this.configService.get("EINVOICE_MERCHANT_ID", "");
    this.hashKey = this.configService.get("EINVOICE_HASH_KEY", "");
    this.hashIV = this.configService.get("EINVOICE_HASH_IV", "");
    this.isProduction = this.configService.get("NODE_ENV") === "production";

    const baseURL = this.getBaseURL();
    this.apiClient = axios.create({
      baseURL,
      timeout: 30000,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    this.logger.log(
      `E-Invoice service initialized: ${this.provider} (${this.isProduction ? "production" : "sandbox"})`,
    );
  }

  private getBaseURL(): string {
    if (this.provider === "ecpay") {
      return this.isProduction
        ? "https://einvoice.ecpay.com.tw/Invoice"
        : "https://einvoice-stage.ecpay.com.tw/Invoice";
    } else {
      return this.isProduction
        ? "https://inv.ezpay.com.tw/Api"
        : "https://cinv.ezpay.com.tw/Api";
    }
  }

  /**
   * 開立電子發票
   */
  async issueInvoice(dto: InvoiceIssueDto): Promise<InvoiceResult> {
    try {
      if (this.provider === "ecpay") {
        return await this.issueECPayInvoice(dto);
      } else {
        return await this.issueEzPayInvoice(dto);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Invoice issue failed: ${message}`, stack);
      return {
        success: false,
        errorMessage: message || "發票開立失敗",
      };
    }
  }

  /**
   * 作廢電子發票
   */
  async voidInvoice(dto: InvoiceVoidDto): Promise<InvoiceResult> {
    try {
      if (this.provider === "ecpay") {
        return await this.voidECPayInvoice(dto);
      } else {
        return await this.voidEzPayInvoice(dto);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Invoice void failed: ${message}`, stack);
      return {
        success: false,
        errorMessage: message || "發票作廢失敗",
      };
    }
  }

  // ========================================
  // ECPay Implementation
  // ========================================

  private async issueECPayInvoice(
    dto: InvoiceIssueDto,
  ): Promise<InvoiceResult> {
    const timestamp = Math.floor(Date.now() / 1000);
    const relateNumber = `INV${Date.now()}`;

    const items = dto.items.map((item, idx) => ({
      ItemSeq: idx + 1,
      ItemName: item.name,
      ItemCount: item.quantity,
      ItemWord: item.unit || "式",
      ItemPrice: item.unitPrice,
      ItemTaxType: "1", // 應稅
      ItemAmount: item.quantity * item.unitPrice,
    }));

    const data: Record<string, string | number | object[]> = {
      MerchantID: this.merchantId,
      RelateNumber: relateNumber,
      CustomerID: "",
      CustomerIdentifier: dto.buyerIdentifier || "",
      CustomerName: dto.buyerName,
      CustomerAddr: "",
      CustomerPhone: "",
      CustomerEmail: dto.buyerEmail || "",
      ClearanceMark: "",
      Print: dto.carrierType ? "0" : "1", // 有載具不印
      Donation: dto.loveCode ? "1" : "0",
      LoveCode: dto.loveCode || "",
      CarrierType: dto.carrierType?.toString() || "",
      CarrierNum: dto.carrierNum || "",
      TaxType: "1", // 應稅
      SalesAmount: dto.amount,
      InvoiceRemark: dto.comment || "",
      Items: items,
      InvType: dto.buyerIdentifier ? "07" : "08", // 07=公司, 08=個人
      vat: "1",
    };

    const encData = this.ecpayEncrypt(JSON.stringify(data));

    const response = await this.apiClient.post("/Issue", {
      MerchantID: this.merchantId,
      RqHeader: { Timestamp: timestamp },
      Data: encData,
    });

    const decrypted = this.ecpayDecrypt(response.data.Data);
    const result = JSON.parse(decrypted);

    if (result.RtnCode === 1) {
      return {
        success: true,
        invoiceNumber: result.InvoiceNo,
        invoiceDate: result.InvoiceDate,
        randomNumber: result.RandomNumber,
        rawResponse: result,
      };
    }

    return {
      success: false,
      errorMessage: result.RtnMsg || "發票開立失敗",
      rawResponse: result,
    };
  }

  private async voidECPayInvoice(dto: InvoiceVoidDto): Promise<InvoiceResult> {
    const timestamp = Math.floor(Date.now() / 1000);

    const data = {
      MerchantID: this.merchantId,
      InvoiceNo: dto.invoiceNumber,
      VoidReason: dto.voidReason,
    };

    const encData = this.ecpayEncrypt(JSON.stringify(data));

    const response = await this.apiClient.post("/Invalid", {
      MerchantID: this.merchantId,
      RqHeader: { Timestamp: timestamp },
      Data: encData,
    });

    const decrypted = this.ecpayDecrypt(response.data.Data);
    const result = JSON.parse(decrypted);

    return {
      success: result.RtnCode === 1,
      invoiceNumber: dto.invoiceNumber,
      errorMessage: result.RtnCode !== 1 ? result.RtnMsg : undefined,
      rawResponse: result,
    };
  }

  private ecpayEncrypt(data: string): string {
    const cipher = crypto.createCipheriv(
      "aes-128-cbc",
      this.hashKey,
      this.hashIV,
    );
    cipher.setAutoPadding(true);
    let encrypted = cipher.update(data, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encodeURIComponent(encrypted);
  }

  private ecpayDecrypt(data: string): string {
    const decipher = crypto.createDecipheriv(
      "aes-128-cbc",
      this.hashKey,
      this.hashIV,
    );
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(decodeURIComponent(data), "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // ========================================
  // ezPay Implementation
  // ========================================

  private async issueEzPayInvoice(
    dto: InvoiceIssueDto,
  ): Promise<InvoiceResult> {
    const orderNo = `INV${Date.now()}`;
    const itemNames = dto.items.map((i) => i.name).join("|");
    const itemCounts = dto.items.map((i) => i.quantity).join("|");
    const itemUnits = dto.items.map((i) => i.unit || "式").join("|");
    const itemPrices = dto.items.map((i) => i.unitPrice).join("|");
    const itemAmounts = dto.items
      .map((i) => i.quantity * i.unitPrice)
      .join("|");

    const postData = {
      RespondType: "JSON",
      Version: "1.5",
      TimeStamp: Math.floor(Date.now() / 1000).toString(),
      TransNum: "",
      MerchantOrderNo: orderNo,
      Status: "1", // 立即開立
      Category: dto.buyerIdentifier ? "B2B" : "B2C",
      BuyerName: dto.buyerName,
      BuyerUBN: dto.buyerIdentifier || "",
      BuyerAddress: "",
      BuyerEmail: dto.buyerEmail || "",
      CarrierType: dto.carrierType?.toString() || "",
      CarrierNum: dto.carrierNum || "",
      LoveCode: dto.loveCode || "",
      PrintFlag: dto.carrierType ? "N" : "Y",
      TaxType: "1",
      TaxRate: "5",
      Amt: Math.round(dto.amount / 1.05),
      TaxAmt: Math.round(dto.amount - dto.amount / 1.05),
      TotalAmt: dto.amount,
      ItemName: itemNames,
      ItemCount: itemCounts,
      ItemUnit: itemUnits,
      ItemPrice: itemPrices,
      ItemAmt: itemAmounts,
      Comment: dto.comment || "",
    };

    const postDataStr = new URLSearchParams(
      postData as unknown as Record<string, string>,
    ).toString();
    const encData = this.ezpayEncrypt(postDataStr);

    const response = await this.apiClient.post("/invoice_issue", {
      MerchantID_: this.merchantId,
      PostData_: encData,
    });

    const result = response.data;

    if (result.Status === "SUCCESS") {
      const invoiceData = JSON.parse(this.ezpayDecrypt(result.Result));
      return {
        success: true,
        invoiceNumber: invoiceData.InvoiceNumber,
        invoiceDate: invoiceData.CreateTime,
        randomNumber: invoiceData.RandomNum,
        rawResponse: invoiceData,
      };
    }

    return {
      success: false,
      errorMessage: result.Message || "發票開立失敗",
      rawResponse: result,
    };
  }

  private async voidEzPayInvoice(dto: InvoiceVoidDto): Promise<InvoiceResult> {
    const postData = {
      RespondType: "JSON",
      Version: "1.0",
      TimeStamp: Math.floor(Date.now() / 1000).toString(),
      InvoiceNumber: dto.invoiceNumber,
      InvalidReason: dto.voidReason,
    };

    const postDataStr = new URLSearchParams(
      postData as unknown as Record<string, string>,
    ).toString();
    const encData = this.ezpayEncrypt(postDataStr);

    const response = await this.apiClient.post("/invoice_invalid", {
      MerchantID_: this.merchantId,
      PostData_: encData,
    });

    const result = response.data;

    return {
      success: result.Status === "SUCCESS",
      invoiceNumber: dto.invoiceNumber,
      errorMessage: result.Status !== "SUCCESS" ? result.Message : undefined,
      rawResponse: result,
    };
  }

  private ezpayEncrypt(data: string): string {
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      this.hashKey,
      this.hashIV,
    );
    cipher.setAutoPadding(true);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  private ezpayDecrypt(data: string): string {
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      this.hashKey,
      this.hashIV,
    );
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}
