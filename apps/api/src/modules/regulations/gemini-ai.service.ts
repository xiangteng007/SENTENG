import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

@Injectable()
export class GeminiAiService {
  private readonly logger = new Logger(GeminiAiService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log("Gemini AI service initialized");
    } else {
      this.logger.warn("GEMINI_API_KEY not configured - AI summaries disabled");
    }
  }

  async generateRegulationSummary(content: string): Promise<string> {
    if (!this.genAI) {
      return "[AI 摘要服務未啟用 - 請設定 GEMINI_API_KEY]";
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const prompt = `你是一位台灣建築法規專家。請用繁體中文為以下法規條文提供簡潔摘要（約 50-100 字），說明其主要規定和適用情境：

法規內容：
${content}

請提供：
1. 一句話概述主要規定
2. 適用的工程類型或情境
3. 重要數值或規格（如有）`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      this.logger.error("Failed to generate regulation summary", error);
      return "[AI 摘要產生失敗]";
    }
  }

  async generateCnsSummary(
    cnsNumber: string,
    title: string,
    scope?: string,
  ): Promise<string> {
    if (!this.genAI) {
      return "[AI 摘要服務未啟用 - 請設定 GEMINI_API_KEY]";
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const prompt = `你是一位台灣建築材料專家。請用繁體中文為以下 CNS 國家標準提供簡潔摘要（約 50-100 字）：

標準編號：${cnsNumber}
標準名稱：${title}
${scope ? `適用範圍：${scope}` : ""}

請提供：
1. 標準的主要用途
2. 適用的材料或產品類型
3. 在建築工程中的應用場景`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      this.logger.error("Failed to generate CNS summary", error);
      return "[AI 摘要產生失敗]";
    }
  }

  async suggestRelatedRegulations(materialCategory: string): Promise<string[]> {
    if (!this.genAI) {
      return [];
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const prompt = `給定材料類別「${materialCategory}」，列出最相關的台灣建築法規條文編號（例如：建技規§407、室裝辦法§24）。
只輸出法規編號，每行一個，最多 5 個。不需要解釋。`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      return response
        .text()
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, 5);
    } catch (error) {
      this.logger.error("Failed to suggest related regulations", error);
      return [];
    }
  }

  isEnabled(): boolean {
    return this.genAI !== null;
  }
}
