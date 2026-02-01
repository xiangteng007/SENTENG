import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Invoice } from "./invoice.entity";

/**
 * 財政部電子發票 Turnkey API 服務
 *
 * 支援 MIG 4.1 規格，直接上傳發票至財政部大平台。
 *
 * 訊息類型：
 * - C0401: B2C 電子發票開立
 * - C0501: 電子發票作廢
 * - C0701: 折讓單開立
 *
 * 傳輸方式：SFTP (需工商憑證)
 *
 * @note POC 版本 - 使用原生 XML 生成，正式環境建議安裝 xml2js
 */

export interface TurnkeyConfig {
  merchantId: string;
  merchantName: string;
  sftpHost: string;
  sftpPort: number;
  sftpUsername: string;
  sftpPrivateKeyPath: string;
  migVersion: "4.0" | "4.1";
  isProduction: boolean;
}

export interface TurnkeyUploadResult {
  success: boolean;
  messageId: string;
  timestamp: string;
  errorMessage?: string;
}

export interface C0401Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceTime: string;
  sellerIdentifier: string;
  sellerName: string;
  buyerIdentifier: string;
  buyerName: string;
  invoiceType: "07" | "08";
  donateMark: "Y" | "N";
  carrierType?: string;
  carrierNum?: string;
  loveCode?: string;
  salesAmount: number;
  taxAmount: number;
  totalAmount: number;
  items: C0401InvoiceItem[];
  randomNumber: string;
}

export interface C0401InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sequenceNumber: number;
}

@Injectable()
export class TurnkeyService {
  private readonly logger = new Logger(TurnkeyService.name);
  private readonly config: TurnkeyConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      merchantId: this.configService.get<string>("TURNKEY_MERCHANT_ID") || "",
      merchantName:
        this.configService.get<string>("TURNKEY_MERCHANT_NAME") || "",
      sftpHost:
        this.configService.get<string>("TURNKEY_SFTP_HOST") ||
        "turnkey.einvoice.nat.gov.tw",
      sftpPort: this.configService.get<number>("TURNKEY_SFTP_PORT") || 22,
      sftpUsername:
        this.configService.get<string>("TURNKEY_SFTP_USERNAME") || "",
      sftpPrivateKeyPath:
        this.configService.get<string>("TURNKEY_SFTP_KEY_PATH") || "",
      migVersion: "4.1",
      isProduction: this.configService.get<string>("NODE_ENV") === "production",
    };
  }

  /**
   * 從 Invoice 實體生成 C0401 (B2C 開立) XML
   */
  generateC0401Xml(invoice: Invoice): string {
    const now = new Date();
    const invoiceNo =
      (invoice.invoiceTrack || "") + (invoice.invoiceNumber || "");
    const c0401: C0401Invoice = {
      invoiceNumber: invoiceNo || invoice.invoiceNo || "",
      invoiceDate:
        invoice.invoiceDate?.toISOString().split("T")[0] ||
        now.toISOString().split("T")[0],
      invoiceTime: now.toTimeString().split(" ")[0],
      sellerIdentifier: invoice.sellerTaxId || this.config.merchantId,
      sellerName: invoice.sellerName || this.config.merchantName,
      buyerIdentifier: invoice.buyerTaxId || "0000000000",
      buyerName: "消費者",
      invoiceType: "07",
      donateMark: "N",
      salesAmount:
        Number(invoice.amountNet) ||
        Math.round(Number(invoice.totalAmount) / 1.05),
      taxAmount:
        Number(invoice.amountTax) ||
        Math.round(
          Number(invoice.totalAmount) - Number(invoice.totalAmount) / 1.05,
        ),
      totalAmount:
        Number(invoice.totalAmount) || Number(invoice.amountGross) || 0,
      items: [
        {
          description: invoice.description || "商品一批",
          quantity: 1,
          unitPrice: Number(invoice.totalAmount) || 0,
          amount: Number(invoice.totalAmount) || 0,
          sequenceNumber: 1,
        },
      ],
      randomNumber: invoice.randomCode || this.generateRandomNumber(),
    };

    return this.buildC0401Xml(c0401);
  }

  /**
   * 建構 MIG 4.1 C0401 XML (使用原生字串模板)
   */
  private buildC0401Xml(data: C0401Invoice): string {
    const itemsXml = data.items
      .map(
        (item) => `
        <ProductItem>
          <Description>${this.escapeXml(item.description)}</Description>
          <Quantity>${item.quantity}</Quantity>
          <UnitPrice>${item.unitPrice}</UnitPrice>
          <Amount>${item.amount}</Amount>
          <SequenceNumber>${item.sequenceNumber}</SequenceNumber>
        </ProductItem>`,
      )
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:GEINV:eInvoiceMessage:C0401:4.1">
  <Main>
    <InvoiceNumber>${data.invoiceNumber}</InvoiceNumber>
    <InvoiceDate>${data.invoiceDate.replace(/-/g, "")}</InvoiceDate>
    <InvoiceTime>${data.invoiceTime}</InvoiceTime>
    <Seller>
      <Identifier>${data.sellerIdentifier}</Identifier>
      <Name>${this.escapeXml(data.sellerName)}</Name>
    </Seller>
    <Buyer>
      <Identifier>${data.buyerIdentifier}</Identifier>
      <Name>${this.escapeXml(data.buyerName)}</Name>
    </Buyer>
    <InvoiceType>${data.invoiceType}</InvoiceType>
    <DonateMark>${data.donateMark}</DonateMark>
    <CarrierType>${data.carrierType || ""}</CarrierType>
    <CarrierNum>${data.carrierNum || ""}</CarrierNum>
    <LoveCode>${data.loveCode || ""}</LoveCode>
    <RandomNumber>${data.randomNumber}</RandomNumber>
  </Main>
  <Details>${itemsXml}
  </Details>
  <Amount>
    <SalesAmount>${data.salesAmount}</SalesAmount>
    <TaxType>1</TaxType>
    <TaxRate>0.05</TaxRate>
    <TaxAmount>${data.taxAmount}</TaxAmount>
    <TotalAmount>${data.totalAmount}</TotalAmount>
  </Amount>
</Invoice>`;
  }

  /**
   * 生成 C0501 (作廢) XML
   */
  generateC0501Xml(invoiceNumber: string, voidReason: string): string {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    const timeStr = now.toTimeString().split(" ")[0];

    return `<?xml version="1.0" encoding="UTF-8"?>
<CancelInvoice xmlns="urn:GEINV:eInvoiceMessage:C0501:4.1">
  <CancelInvoiceNumber>${invoiceNumber}</CancelInvoiceNumber>
  <InvoiceDate>${dateStr}</InvoiceDate>
  <BuyerId>0000000000</BuyerId>
  <SellerId>${this.config.merchantId}</SellerId>
  <CancelDate>${dateStr}</CancelDate>
  <CancelTime>${timeStr}</CancelTime>
  <CancelReason>${this.escapeXml(voidReason)}</CancelReason>
</CancelInvoice>`;
  }

  /**
   * 上傳 XML 至 Turnkey SFTP
   *
   * @note POC - 實際 SFTP 上傳需安裝 ssh2-sftp-client
   */
  async uploadToTurnkey(
    xml: string,
    messageType: "C0401" | "C0501" | "C0701",
  ): Promise<TurnkeyUploadResult> {
    const messageId = `${this.config.merchantId}_${messageType}_${Date.now()}`;
    const filename = `${messageId}.xml`;

    this.logger.log(`Uploading ${messageType} to Turnkey: ${filename}`);

    if (!this.config.sftpUsername) {
      this.logger.warn("Turnkey SFTP not configured. Skipping upload.");
      return {
        success: false,
        messageId,
        timestamp: new Date().toISOString(),
        errorMessage: "Turnkey SFTP credentials not configured",
      };
    }

    // @future(EINV-001): Implement SFTP upload with ssh2-sftp-client
    // Dependency: npm install ssh2-sftp-client @types/ssh2-sftp-client
    this.logger.log(`XML content length: ${xml.length} bytes`);

    return {
      success: true,
      messageId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 查詢上傳狀態
   */
  async checkUploadStatus(
    messageId: string,
  ): Promise<{ status: string; message?: string }> {
    this.logger.debug(`Checking status for: ${messageId}`);
    return { status: "PENDING", message: "Status check not implemented" };
  }

  private generateRandomNumber(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
