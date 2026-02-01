import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike, FindOptionsWhere } from "typeorm";
import * as cheerio from "cheerio";
import {
  RegulationSource,
  RegulationArticle,
  MaterialRegulationMapping,
  CnsStandard,
} from "./entities";
import { CnsCategory } from "./entities/cns-standard.entity";

// 預設法規來源配置
const REGULATION_SOURCES = [
  {
    pcode: "D0070115",
    name: "建築技術規則建築設計施工編",
    category: "建築技術規則",
  },
  {
    pcode: "D0070116",
    name: "建築技術規則建築設備編",
    category: "建築技術規則",
  },
  {
    pcode: "D0070117",
    name: "建築技術規則建築構造編",
    category: "建築技術規則",
  },
  { pcode: "D0070114", name: "建築技術規則總則編", category: "建築技術規則" },
  {
    pcode: "D0070148",
    name: "建築物室內裝修管理辦法",
    category: "室內裝修管理",
  },
];

// 材料關鍵字對應
const MATERIAL_KEYWORDS = {
  混凝土: ["混凝土", "水泥", "RC", "鋼筋混凝土", "預拌"],
  鋼筋: ["鋼筋", "鋼材", "鋼構"],
  磁磚: ["磁磚", "瓷磚", "面磚", "地磚", "壁磚"],
  油漆: ["油漆", "塗料", "粉刷", "漆"],
  防水: ["防水", "防潮", "止水"],
  門窗: ["門", "窗", "鋁窗", "氣密窗"],
  消防: ["消防", "防火", "逃生", "滅火"],
  電氣: ["電線", "配電", "電力", "迴路"],
  給排水: ["給水", "排水", "污水", "管線"],
  裝修: ["裝修", "裝潢", "室內裝修"],
};

interface SyncStatus {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: Date;
  completedAt?: Date;
  progress: number;
  message?: string;
  errors?: string[];
}

@Injectable()
export class RegulationsService {
  private readonly logger = new Logger(RegulationsService.name);
  private syncStatus: SyncStatus | null = null;

  constructor(
    @InjectRepository(RegulationSource)
    private readonly sourceRepo: Repository<RegulationSource>,
    @InjectRepository(RegulationArticle)
    private readonly articleRepo: Repository<RegulationArticle>,
    @InjectRepository(MaterialRegulationMapping)
    private readonly mappingRepo: Repository<MaterialRegulationMapping>,
    @InjectRepository(CnsStandard)
    private readonly cnsRepo: Repository<CnsStandard>,
  ) {}

  /**
   * 取得同步狀態
   */
  getSyncStatus(): SyncStatus | null {
    return this.syncStatus;
  }

  /**
   * 手動觸發法規同步
   */
  async syncRegulations(
    pcodes?: string[],
  ): Promise<{ jobId: string; status: string }> {
    const jobId = `sync-${Date.now()}`;

    this.syncStatus = {
      jobId,
      status: "running",
      startedAt: new Date(),
      progress: 0,
    };

    // 非同步執行爬蟲
    this.runCrawler(pcodes).catch((err) => {
      this.logger.error("Crawler failed", err);
      if (this.syncStatus) {
        this.syncStatus.status = "failed";
        this.syncStatus.message = err.message;
      }
    });

    return { jobId, status: "started" };
  }

  /**
   * 執行爬蟲
   */
  private async runCrawler(pcodes?: string[]): Promise<void> {
    const sources = pcodes?.length
      ? REGULATION_SOURCES.filter((s) => pcodes.includes(s.pcode))
      : REGULATION_SOURCES;

    const totalSources = sources.length;
    let processedSources = 0;

    for (const sourceConfig of sources) {
      try {
        this.logger.log(
          `Crawling ${sourceConfig.name} (${sourceConfig.pcode})`,
        );

        // 確保來源存在
        let source = await this.sourceRepo.findOne({
          where: { pcode: sourceConfig.pcode },
        });
        if (!source) {
          source = this.sourceRepo.create(sourceConfig);
          source = await this.sourceRepo.save(source);
        }

        // 爬取條文
        const articles = await this.crawlArticles(sourceConfig.pcode);
        this.logger.log(
          `Found ${articles.length} articles for ${sourceConfig.pcode}`,
        );

        // 儲存條文
        for (const articleData of articles) {
          await this.saveArticle(source.id, articleData);
        }

        // 更新來源資訊
        source.articleCount = articles.length;
        source.lastSyncedAt = new Date();
        await this.sourceRepo.save(source);

        processedSources++;
        if (this.syncStatus) {
          this.syncStatus.progress = Math.round(
            (processedSources / totalSources) * 100,
          );
        }

        // 爬蟲禮儀：間隔 500ms
        await this.delay(500);
      } catch (error) {
        this.logger.error(`Failed to crawl ${sourceConfig.pcode}`, error);
      }
    }

    // 更新材料對應
    await this.updateMaterialMappings();

    if (this.syncStatus) {
      this.syncStatus.status = "completed";
      this.syncStatus.completedAt = new Date();
      this.syncStatus.progress = 100;
    }
  }

  /**
   * 爬取單一法規的所有條文
   */
  private async crawlArticles(pcode: string): Promise<
    Array<{
      articleNo: string;
      chapter?: string;
      content: string;
      sourceUrl: string;
    }>
  > {
    const baseUrl = `https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=${pcode}`;

    try {
      const response = await fetch(baseUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const articles: Array<{
        articleNo: string;
        chapter?: string;
        content: string;
        sourceUrl: string;
      }> = [];

      // 解析條文結構
      let currentChapter = "";

      // 找到條文列表區域
      $(".law-reg-content .row").each((_, row) => {
        const $row = $(row);

        // 檢查是否為章節標題
        const chapterEl = $row.find(".col-no");
        if (chapterEl.length && chapterEl.text().includes("章")) {
          currentChapter = chapterEl.text().trim();
          return;
        }

        // 解析條文
        const articleNoEl = $row.find(".col-no a");
        const contentEl = $row.find(".col-data");

        if (articleNoEl.length && contentEl.length) {
          const articleNo = articleNoEl
            .text()
            .replace("第", "")
            .replace("條", "")
            .trim();
          const content = contentEl.text().trim();
          const sourceUrl = `https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=${pcode}&flno=${articleNo}`;

          if (articleNo && content) {
            articles.push({
              articleNo,
              chapter: currentChapter || undefined,
              content,
              sourceUrl,
            });
          }
        }
      });

      // 備用解析方式：直接找條文連結
      if (articles.length === 0) {
        $('a[href*="LawSingle.aspx"]').each((_, el) => {
          const href = $(el).attr("href") || "";
          const match = href.match(/flno=([0-9-]+)/);
          if (match) {
            const articleNo = match[1];
            articles.push({
              articleNo,
              content: "(內容需單獨抓取)",
              sourceUrl: `https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=${pcode}&flno=${articleNo}`,
            });
          }
        });
      }

      return articles;
    } catch (error) {
      this.logger.error(`Failed to crawl ${pcode}`, error);
      return [];
    }
  }

  /**
   * 儲存條文
   */
  private async saveArticle(
    sourceId: string,
    data: {
      articleNo: string;
      chapter?: string;
      content: string;
      sourceUrl: string;
    },
  ): Promise<void> {
    // 從內容提取關鍵字
    const keywords = this.extractKeywords(data.content);

    await this.articleRepo.upsert(
      {
        sourceId,
        articleNo: data.articleNo,
        chapter: data.chapter,
        content: data.content,
        keywords,
        sourceUrl: data.sourceUrl,
      },
      ["sourceId", "articleNo"],
    );
  }

  /**
   * 提取關鍵字
   */
  private extractKeywords(content: string): string[] {
    const keywords: string[] = [];

    for (const [category, terms] of Object.entries(MATERIAL_KEYWORDS)) {
      for (const term of terms) {
        if (content.includes(term)) {
          keywords.push(category);
          break;
        }
      }
    }

    return [...new Set(keywords)];
  }

  /**
   * 更新材料-法規對應
   */
  private async updateMaterialMappings(): Promise<void> {
    // 清除現有對應
    await this.mappingRepo.clear();

    // 為每個材料類別建立對應
    for (const [category, terms] of Object.entries(MATERIAL_KEYWORDS)) {
      const articles = await this.articleRepo
        .createQueryBuilder("article")
        .where("article.keywords && ARRAY[:...terms]", { terms: [category] })
        .getMany();

      for (const article of articles) {
        await this.mappingRepo.save({
          materialCategory: category,
          materialKeyword: terms[0],
          articleId: article.id,
          relevanceScore: 1.0,
        });
      }
    }
  }

  /**
   * 列出所有法規來源
   */
  async getSources(): Promise<RegulationSource[]> {
    return this.sourceRepo.find({
      order: { category: "ASC", name: "ASC" },
    });
  }

  /**
   * 查詢法規條文
   */
  async getArticles(pcode?: string, limit = 50): Promise<RegulationArticle[]> {
    const query = this.articleRepo
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.source", "source")
      .orderBy("article.articleNo", "ASC")
      .take(limit);

    if (pcode) {
      query.andWhere("source.pcode = :pcode", { pcode });
    }

    return query.getMany();
  }

  /**
   * 搜尋法規
   */
  async searchArticles(
    queryText: string,
    pcode?: string,
    limit = 20,
  ): Promise<RegulationArticle[]> {
    const query = this.articleRepo
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.source", "source")
      .where("article.content ILIKE :search", { search: `%${queryText}%` })
      .orderBy("article.articleNo", "ASC")
      .take(limit);

    if (pcode) {
      query.andWhere("source.pcode = :pcode", { pcode });
    }

    return query.getMany();
  }

  /**
   * 取得材料相關法規
   */
  async getRegulationsByMaterial(category: string): Promise<{
    category: string;
    regulations: Array<{
      articleId: string;
      articleNo: string;
      sourceName: string;
      content: string;
      sourceUrl: string;
    }>;
  }> {
    const mappings = await this.mappingRepo.find({
      where: { materialCategory: category },
      relations: ["article", "article.source"],
    });

    return {
      category,
      regulations: mappings.map((m) => ({
        articleId: m.articleId,
        articleNo: m.article?.articleNo || "",
        sourceName: m.article?.source?.name || "",
        content: m.article?.content || "",
        sourceUrl: m.article?.sourceUrl || "",
      })),
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==========================================
  // CNS 標準查詢
  // ==========================================

  /**
   * 查詢 CNS 標準
   */
  async getCnsStandards(
    category?: string,
    search?: string,
  ): Promise<CnsStandard[]> {
    const where: FindOptionsWhere<CnsStandard> = { isActive: true };

    if (category) {
      where.category = category as CnsCategory;
    }

    if (search) {
      return this.cnsRepo
        .createQueryBuilder("cns")
        .where("cns.isActive = true")
        .andWhere(category ? "cns.category = :category" : "1=1", { category })
        .andWhere(
          "(cns.title ILIKE :search OR cns.cnsNumber ILIKE :search OR cns.description ILIKE :search)",
          { search: `%${search}%` },
        )
        .orderBy("cns.cnsNumber", "ASC")
        .getMany();
    }

    return this.cnsRepo.find({
      where,
      order: { cnsNumber: "ASC" },
    });
  }

  /**
   * 取得 CNS 分類列表
   */
  async getCnsCategories(): Promise<
    { category: string; count: number; label: string }[]
  > {
    const results = await this.cnsRepo
      .createQueryBuilder("cns")
      .select("cns.category", "category")
      .addSelect("COUNT(*)", "count")
      .where("cns.isActive = true")
      .groupBy("cns.category")
      .orderBy("cns.category", "ASC")
      .getRawMany();

    const categoryLabels: Record<string, string> = {
      steel: "鋼筋鋼材",
      concrete: "混凝土骨材",
      board: "板材",
      wood: "木材夾板",
      coating: "塗料油漆",
      tile: "磁磚石材",
      glass: "玻璃",
      insulation: "隔熱隔音",
      drafting: "製圖標準",
      other: "其他",
    };

    return results.map((r) => ({
      category: r.category,
      count: parseInt(r.count, 10),
      label: categoryLabels[r.category] || r.category,
    }));
  }

  /**
   * 依編號取得 CNS 標準
   */
  async getCnsByNumber(cnsNumber: string): Promise<CnsStandard | null> {
    return this.cnsRepo.findOne({
      where: { cnsNumber: ILike(`%${cnsNumber}%`) },
    });
  }

  /**
   * 依 ID 取得單一法規條文
   */
  async getArticleById(articleId: string): Promise<RegulationArticle | null> {
    return this.articleRepo.findOne({
      where: { id: articleId },
      relations: ["source"],
    });
  }
}
