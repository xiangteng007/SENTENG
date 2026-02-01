import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as ExcelJS from "exceljs";
import { Invoice } from "./invoice.entity";
import { InvoicesService } from "./invoices.service";
import {
  ExportExcelDto,
  Export401Dto,
  ExportPdfDto,
  ExportFormat,
} from "./invoice-export.dto";
import { QueryInvoiceDto, VatDeductibleStatus } from "./invoice.dto";

/**
 * 發票匯出服務
 * 負責 Excel、CSV、401申報格式、PDF 匯出功能
 */
@Injectable()
export class InvoiceExportService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    private invoicesService: InvoicesService,
  ) {}

  /**
   * 匯出 Excel 或 CSV
   */
  async exportToExcel(
    query: ExportExcelDto,
    userId?: string,
    userRole?: string,
  ): Promise<Buffer> {
    // Get all invoices matching query (no pagination for export)
    const exportQuery = { ...query, page: 1, limit: 10000 };
    const { data: invoices } = await this.invoicesService.findAll(
      exportQuery,
      userId,
      userRole,
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Senteng ERP";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("發票清單");

    // Define columns
    worksheet.columns = [
      { header: "發票號碼", key: "invoiceNo", width: 15 },
      { header: "發票日期", key: "invoiceDate", width: 12 },
      { header: "期別", key: "invoicePeriod", width: 8 },
      { header: "銷方統編", key: "sellerTaxId", width: 12 },
      { header: "銷方名稱", key: "sellerName", width: 25 },
      { header: "買方統編", key: "buyerTaxId", width: 12 },
      { header: "未稅金額", key: "amountNet", width: 12 },
      { header: "稅額", key: "amountTax", width: 10 },
      { header: "含稅金額", key: "amountGross", width: 12 },
      { header: "狀態", key: "currentState", width: 15 },
      { header: "付款狀態", key: "paymentStatus", width: 12 },
      { header: "扣抵狀態", key: "vatDeductibleStatus", width: 12 },
      { header: "專案", key: "projectName", width: 20 },
      { header: "廠商", key: "vendorName", width: 20 },
      { header: "說明", key: "description", width: 30 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add data rows
    for (const inv of invoices) {
      worksheet.addRow({
        invoiceNo:
          inv.invoiceNo ||
          `${inv.invoiceTrack || ""}${inv.invoiceNumber || ""}`,
        invoiceDate: inv.invoiceDate
          ? new Date(inv.invoiceDate).toLocaleDateString("zh-TW")
          : "",
        invoicePeriod: inv.invoicePeriod,
        sellerTaxId: inv.sellerTaxId,
        sellerName: inv.sellerName,
        buyerTaxId: inv.buyerTaxId,
        amountNet: Number(inv.amountNet || 0),
        amountTax: Number(inv.amountTax || 0),
        amountGross: Number(inv.amountGross || 0),
        currentState: inv.currentState,
        paymentStatus: inv.paymentStatus,
        vatDeductibleStatus: inv.vatDeductibleStatus,
        projectName: inv.project?.name || "",
        vendorName: inv.vendor?.name || "",
        description: inv.description,
      });
    }

    // Format number columns
    ["amountNet", "amountTax", "amountGross"].forEach((key) => {
      worksheet.getColumn(key).numFmt = "#,##0";
    });

    // Generate buffer
    if (query.format === ExportFormat.CSV) {
      return Buffer.from(await workbook.csv.writeBuffer());
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * 匯出 401 申報格式
   * 依財政部媒體申報標準格式
   */
  async exportTo401(
    dto: Export401Dto,
    userId?: string,
    userRole?: string,
  ): Promise<string> {
    // Parse period to get month range
    const [startMonth, endMonth] = dto.period.split("-").map(Number);
    const year = dto.year || new Date().getFullYear() - 1911; // 民國年

    // Get eligible invoices for this period
    const queryDto = {
      invoicePeriod: dto.period,
      vatDeductibleStatus: VatDeductibleStatus.ELIGIBLE,
      page: 1,
      limit: 10000,
    } as QueryInvoiceDto;

    const { data: invoices } = await this.invoicesService.findAll(
      queryDto,
      userId,
      userRole,
    );

    // 401 format: fixed-width columns
    const lines: string[] = [];

    for (const inv of invoices) {
      const invDate = inv.invoiceDate ? new Date(inv.invoiceDate) : new Date();
      const rocYear = (invDate.getFullYear() - 1911)
        .toString()
        .padStart(3, "0");
      const month = (invDate.getMonth() + 1).toString().padStart(2, "0");
      const day = invDate.getDate().toString().padStart(2, "0");

      const line = [
        (dto.buyerTaxId || "").padEnd(8, " "),
        (inv.sellerTaxId || "").padEnd(8, " "),
        (inv.invoiceTrack || "").padEnd(2, " "),
        (inv.invoiceNumber || "").padStart(8, "0"),
        rocYear,
        month,
        day,
        Math.round(Number(inv.amountNet || 0))
          .toString()
          .padStart(10, "0"),
        Math.round(Number(inv.amountTax || 0))
          .toString()
          .padStart(10, "0"),
      ].join("");

      lines.push(line);
    }

    // Add summary header
    const totalNet = invoices.reduce(
      (sum, i) => sum + Number(i.amountNet || 0),
      0,
    );
    const totalTax = invoices.reduce(
      (sum, i) => sum + Number(i.amountTax || 0),
      0,
    );
    const header = `# 401進項申報媒體檔 期別:${year}年${dto.period}月 買方統編:${dto.buyerTaxId} 筆數:${invoices.length} 未稅合計:${totalNet} 稅額合計:${totalTax}`;

    return [header, ...lines].join("\n");
  }

  /**
   * 匯出 PDF 報表
   * 使用 pdfmake 生成
   */
  async exportToPdf(
    query: ExportPdfDto,
    userId?: string,
    userRole?: string,
  ): Promise<Buffer> {
    // Dynamically import pdfmake (CommonJS module)
    const PdfPrinter = (await import("pdfmake")).default;

    const exportQuery = { ...query, page: 1, limit: 10000 };
    const { data: invoices } = await this.invoicesService.findAll(
      exportQuery,
      userId,
      userRole,
    );

    // Calculate totals
    const totalNet = invoices.reduce(
      (sum, i) => sum + Number(i.amountNet || 0),
      0,
    );
    const totalTax = invoices.reduce(
      (sum, i) => sum + Number(i.amountTax || 0),
      0,
    );
    const totalGross = invoices.reduce(
      (sum, i) => sum + Number(i.amountGross || 0),
      0,
    );

    // Define fonts
    const fonts = {
      Roboto: {
        normal: "node_modules/pdfmake/build/vfs_fonts.js",
      },
    };

    const printer = new PdfPrinter(fonts);

    // Create document definition
    const docDefinition: any = {
      content: [
        { text: "發票清單報表", style: "header" },
        {
          text: `產生時間: ${new Date().toLocaleString("zh-TW")}`,
          style: "subheader",
        },
        { text: " " },
        {
          table: {
            headerRows: 1,
            widths: ["auto", "auto", "auto", "auto", "auto"],
            body: [
              ["發票號碼", "銷方名稱", "未稅金額", "稅額", "含稅金額"],
              ...invoices.map((inv) => [
                inv.invoiceNo ||
                  `${inv.invoiceTrack || ""}${inv.invoiceNumber || ""}`,
                inv.sellerName || "",
                Number(inv.amountNet || 0).toLocaleString(),
                Number(inv.amountTax || 0).toLocaleString(),
                Number(inv.amountGross || 0).toLocaleString(),
              ]),
              [
                { text: "合計", bold: true },
                "",
                { text: totalNet.toLocaleString(), bold: true },
                { text: totalTax.toLocaleString(), bold: true },
                { text: totalGross.toLocaleString(), bold: true },
              ],
            ],
          },
        },
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 10, color: "gray" },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", reject);
      pdfDoc.end();
    });
  }
}
