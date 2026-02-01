/**
 * Accounting Export Service
 *
 * Export formats for Taiwan accounting systems:
 * - 鼎新 (Digiwin) ERP format
 * - Generic CSV/XML exports
 */

import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";

export interface ExportPeriod {
  startDate: string;
  endDate: string;
}

export interface DigiwinVoucherEntry {
  voucherNo: string;
  voucherDate: string;
  accountCode: string;
  accountName: string;
  departmentCode: string;
  projectCode: string;
  debit: number;
  credit: number;
  description: string;
  currencyCode: string;
  exchangeRate: number;
}

export interface DigiwinExportResult {
  format: "digiwin";
  version: string;
  generatedAt: string;
  period: ExportPeriod;
  totalVouchers: number;
  totalDebit: number;
  totalCredit: number;
  entries: DigiwinVoucherEntry[];
  csvContent: string;
}

export interface GenericExportOptions {
  format: "csv" | "xml" | "json";
  includeHeaders?: boolean;
  delimiter?: string;
  encoding?: "utf-8" | "big5";
  fields?: string[];
}

@Injectable()
export class AccountingExportService {
  private readonly logger = new Logger(AccountingExportService.name);

  constructor() {}

  /**
   * 鼎新 ERP 傳票匯出
   */
  async exportToDigiwin(
    period: ExportPeriod,
    projectId?: string,
  ): Promise<DigiwinExportResult> {
    this.logger.log(
      `Exporting to Digiwin format for period: ${period.startDate} - ${period.endDate}`,
    );

    // @future(ACCT-001): Query actual transaction data from database
    const entries: DigiwinVoucherEntry[] = [
      {
        voucherNo: "V202601-0001",
        voucherDate: "2026-01-15",
        accountCode: "5101",
        accountName: "工程收入",
        departmentCode: "ENG",
        projectCode: "P2026-001",
        debit: 0,
        credit: 1500000,
        description: "第一期工程款收入",
        currencyCode: "TWD",
        exchangeRate: 1,
      },
      {
        voucherNo: "V202601-0001",
        voucherDate: "2026-01-15",
        accountCode: "1131",
        accountName: "應收帳款",
        departmentCode: "ENG",
        projectCode: "P2026-001",
        debit: 1500000,
        credit: 0,
        description: "第一期工程款應收",
        currencyCode: "TWD",
        exchangeRate: 1,
      },
    ];

    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    // Generate Digiwin CSV format
    const csvLines = [
      "傳票號碼,傳票日期,科目代碼,科目名稱,部門代碼,專案代碼,借方金額,貸方金額,摘要,幣別,匯率",
      ...entries.map(
        (e) =>
          `${e.voucherNo},${e.voucherDate},${e.accountCode},${e.accountName},${e.departmentCode},${e.projectCode},${e.debit},${e.credit},${e.description},${e.currencyCode},${e.exchangeRate}`,
      ),
    ];

    return {
      format: "digiwin",
      version: "3.0",
      generatedAt: new Date().toISOString(),
      period,
      totalVouchers: [...new Set(entries.map((e) => e.voucherNo))].length,
      totalDebit,
      totalCredit,
      entries,
      csvContent: csvLines.join("\n"),
    };
  }

  /**
   * 通用 CSV 匯出
   */
  async exportToCSV<T>(
    data: T[],
    options: GenericExportOptions,
  ): Promise<string> {
    if (data.length === 0) return "";

    const delimiter = options.delimiter || ",";
    const fields = options.fields || Object.keys(data[0] as object);
    const lines: string[] = [];

    if (options.includeHeaders !== false) {
      lines.push(fields.join(delimiter));
    }

    data.forEach((item) => {
      const values = fields.map((field) => {
        const value = (item as Record<string, unknown>)[field];
        if (typeof value === "string") {
          if (value.includes(delimiter) || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }
        if (typeof value === "number" || typeof value === "boolean") {
          return String(value);
        }
        return value === null || value === undefined
          ? ""
          : JSON.stringify(value);
      });
      lines.push(values.join(delimiter));
    });

    return lines.join("\n");
  }

  /**
   * 通用 XML 匯出
   */
  async exportToXML<T>(
    data: T[],
    rootElement: string,
    itemElement: string,
  ): Promise<string> {
    const xmlLines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<${rootElement}>`,
    ];

    data.forEach((item) => {
      xmlLines.push(`  <${itemElement}>`);
      Object.entries(item as object).forEach(([key, value]) => {
        let stringValue: string;
        if (typeof value === "string") {
          stringValue = value;
        } else if (typeof value === "number" || typeof value === "boolean") {
          stringValue = String(value);
        } else if (value === null || value === undefined) {
          stringValue = "";
        } else {
          stringValue = JSON.stringify(value);
        }
        const escapedValue = stringValue
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        xmlLines.push(`    <${key}>${escapedValue}</${key}>`);
      });
      xmlLines.push(`  </${itemElement}>`);
    });

    xmlLines.push(`</${rootElement}>`);
    return xmlLines.join("\n");
  }

  /**
   * 匯出專案成本明細
   */
  async exportProjectCosts(
    projectId: string,
    period: ExportPeriod,
    options: GenericExportOptions,
  ): Promise<string> {
    this.logger.log(`Exporting project costs for ${projectId}`);

    // @future(ACCT-002): Query actual cost data from cost_entries table
    const mockCosts = [
      {
        date: "2026-01-15",
        category: "材料",
        item: "鋼筋",
        quantity: 1000,
        unit: "kg",
        unitPrice: 25,
        amount: 25000,
      },
      {
        date: "2026-01-16",
        category: "人工",
        item: "土木工",
        quantity: 8,
        unit: "工",
        unitPrice: 3000,
        amount: 24000,
      },
    ];

    if (options.format === "xml") {
      return this.exportToXML(mockCosts, "ProjectCosts", "CostEntry");
    }
    return this.exportToCSV(mockCosts, options);
  }

  /**
   * 匯出發票明細
   */
  async exportInvoices(
    period: ExportPeriod,
    options: GenericExportOptions,
  ): Promise<string> {
    this.logger.log(
      `Exporting invoices for period: ${period.startDate} - ${period.endDate}`,
    );

    // @future(ACCT-003): Query actual invoice data from invoices table
    const mockInvoices = [
      {
        invoiceNo: "AB-12345678",
        date: "2026-01-15",
        customer: "森騰營造",
        amount: 150000,
        tax: 7500,
        total: 157500,
      },
    ];

    if (options.format === "xml") {
      return this.exportToXML(mockInvoices, "Invoices", "Invoice");
    }
    return this.exportToCSV(mockInvoices, options);
  }
}
