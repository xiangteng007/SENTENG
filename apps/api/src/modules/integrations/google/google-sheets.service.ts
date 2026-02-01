/**
 * google-sheets.service.ts
 *
 * Google Sheets 匯出服務
 * 將估價單匯出為 Google Spreadsheet
 */

import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { google, sheets_v4 } from "googleapis";
import { GoogleOAuthService } from "./google-oauth.service";

export interface EstimateLine {
  id: string;
  categoryL1: string;
  categoryL2: string;
  name: string;
  spec: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  note?: string;
}

export interface ExportEstimateRequest {
  estimateLines: EstimateLine[];
  options?: {
    title?: string;
    projectName?: string;
    includeMetadata?: boolean;
  };
}

export interface ExportEstimateResponse {
  sheetId: string;
  sheetUrl: string;
  createdAt: string;
}

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);

  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  /**
   * 匯出估價單到 Google Sheets
   */
  async exportEstimate(
    userId: string,
    request: ExportEstimateRequest,
  ): Promise<ExportEstimateResponse> {
    this.logger.log(`Exporting estimate for user ${userId}`);

    // 取得有效的 OAuth2Client
    const auth = await this.googleOAuthService.getOAuth2Client(userId);
    const sheets = google.sheets({ version: "v4", auth });

    const title =
      request.options?.title ||
      `估價單_${new Date().toISOString().split("T")[0]}`;

    try {
      // 1. 建立新的 Spreadsheet
      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title,
            locale: "zh_TW",
          },
          sheets: [
            { properties: { title: "摘要", index: 0 } },
            { properties: { title: "估價明細", index: 1 } },
          ],
        },
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId!;
      const spreadsheetUrl = spreadsheet.data.spreadsheetUrl!;

      this.logger.log(`Created spreadsheet: ${spreadsheetId}`);

      // 2. 準備資料
      const { estimateLines } = request;

      // 計算分類小計
      const categoryTotals: Record<string, number> = {};
      let grandTotal = 0;

      estimateLines.forEach((line) => {
        const subtotal = (line.quantity || 0) * (line.unitPrice || 0);
        const key = line.categoryL1;
        categoryTotals[key] = (categoryTotals[key] || 0) + subtotal;
        grandTotal += subtotal;
      });

      // 3. 寫入摘要
      const summaryData: (string | number)[][] = [
        ["估價單摘要"],
        [],
        ["專案名稱", request.options?.projectName || "（未指定）"],
        ["匯出時間", new Date().toLocaleString("zh-TW")],
        ["總項目數", estimateLines.length],
        [],
        ["分類小計"],
      ];

      Object.entries(categoryTotals).forEach(([category, total]) => {
        summaryData.push([
          this.getCategoryLabel(category),
          this.formatCurrency(total),
        ]);
      });

      summaryData.push([]);
      summaryData.push(["總計", this.formatCurrency(grandTotal)]);

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "摘要!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: summaryData },
      });

      // 4. 寫入估價明細
      const detailHeader = [
        "#",
        "分類L1",
        "分類L2",
        "名稱",
        "規格",
        "單位",
        "數量",
        "單價",
        "小計",
        "備註",
      ];

      const detailData: (string | number)[][] = [detailHeader];

      estimateLines.forEach((line, index) => {
        const subtotal = (line.quantity || 0) * (line.unitPrice || 0);
        detailData.push([
          index + 1,
          this.getCategoryLabel(line.categoryL1),
          this.getSubcategoryLabel(line.categoryL1, line.categoryL2),
          line.name,
          line.spec || "",
          line.unit,
          line.quantity,
          line.unitPrice,
          subtotal,
          line.note || "",
        ]);
      });

      // 加入總計行
      detailData.push([]);
      detailData.push(["", "", "", "", "", "", "", "總計", grandTotal, ""]);

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "估價明細!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: detailData },
      });

      // 5. 格式化（可選）
      await this.formatSpreadsheet(sheets, spreadsheetId, estimateLines.length);

      this.logger.log(`Estimate exported successfully: ${spreadsheetUrl}`);

      return {
        sheetId: spreadsheetId,
        sheetUrl: spreadsheetUrl,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to export estimate: ${message}`);
      throw new Error(`匯出失敗: ${message}`);
    }
  }

  /**
   * 格式化試算表
   */
  private async formatSpreadsheet(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    lineCount: number,
  ): Promise<void> {
    try {
      // 取得 sheet IDs
      const spreadsheetsInfo = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      const summarySheetId =
        spreadsheetsInfo.data.sheets?.[0]?.properties?.sheetId || 0;
      const detailSheetId =
        spreadsheetsInfo.data.sheets?.[1]?.properties?.sheetId || 0;

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            // 摘要 header 加粗
            {
              repeatCell: {
                range: {
                  sheetId: summarySheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 2,
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: { bold: true, fontSize: 14 },
                  },
                },
                fields: "userEnteredFormat.textFormat",
              },
            },
            // 明細 header 加粗 + 背景色
            {
              repeatCell: {
                range: {
                  sheetId: detailSheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 10,
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                  },
                },
                fields:
                  "userEnteredFormat.textFormat,userEnteredFormat.backgroundColor",
              },
            },
            // 凍結首行
            {
              updateSheetProperties: {
                properties: {
                  sheetId: detailSheetId,
                  gridProperties: { frozenRowCount: 1 },
                },
                fields: "gridProperties.frozenRowCount",
              },
            },
            // 自動調整欄寬
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: detailSheetId,
                  dimension: "COLUMNS",
                  startIndex: 0,
                  endIndex: 10,
                },
              },
            },
          ],
        },
      });
    } catch (error) {
      // 格式化失敗不影響主流程
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to format spreadsheet: ${message}`);
    }
  }

  /**
   * 取得分類中文名稱
   */
  private getCategoryLabel(categoryId: string): string {
    const map: Record<string, string> = {
      construction: "營建工程",
      interior: "室內裝潢",
    };
    return map[categoryId] || categoryId;
  }

  /**
   * 取得次分類中文名稱
   */
  private getSubcategoryLabel(categoryL1: string, categoryL2: string): string {
    const map: Record<string, Record<string, string>> = {
      construction: {
        structure: "結構工程",
        masonry: "泥作工程",
        tile: "磁磚工程",
        coating: "塗料工程",
        overview: "建築概估",
      },
      interior: {
        paint: "油漆",
        woodwork: "木作",
        masonry: "泥作",
        electrical: "水電",
        glass: "玻璃",
        flooring: "地板",
      },
    };
    return map[categoryL1]?.[categoryL2] || categoryL2;
  }

  /**
   * 格式化金額
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
