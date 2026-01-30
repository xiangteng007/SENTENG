import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RegulationsService } from './regulations.service';
import { GeminiAiService } from './gemini-ai.service';
import { SyncRegulationsDto, SearchRegulationsDto } from './dto/regulations.dto';
import { SyncStatus, IdleSyncStatus } from './dto/sync-status.interface';

@ApiTags('regulations')
@Controller('regulations')
export class RegulationsController {
  constructor(
    private readonly regulationsService: RegulationsService,
    private readonly geminiAiService: GeminiAiService
  ) {}

  // ==========================================
  // 法規條文 APIs
  // ==========================================

  @Post('sync')
  @ApiOperation({ summary: '手動觸發法規同步' })
  @ApiResponse({ status: 200, description: '同步任務已啟動' })
  async syncRegulations(@Body() dto: SyncRegulationsDto) {
    return this.regulationsService.syncRegulations(dto.pcodes);
  }

  @Get('sync/status')
  @ApiOperation({ summary: '取得同步狀態' })
  @ApiResponse({ status: 200, description: '同步狀態' })
  getSyncStatus(): SyncStatus | IdleSyncStatus {
    const status = this.regulationsService.getSyncStatus();
    if (!status) {
      return { status: 'idle', message: 'No sync job running' };
    }
    return status;
  }

  @Get('sources')
  @ApiOperation({ summary: '列出所有法規來源' })
  @ApiResponse({ status: 200, description: '法規來源列表' })
  async getSources() {
    return this.regulationsService.getSources();
  }

  @Get('articles')
  @ApiOperation({ summary: '查詢法規條文' })
  @ApiQuery({ name: 'pcode', required: false, description: '法規代碼' })
  @ApiQuery({ name: 'limit', required: false, description: '筆數限制' })
  @ApiResponse({ status: 200, description: '法規條文列表' })
  async getArticles(@Query('pcode') pcode?: string, @Query('limit') limit?: number) {
    return this.regulationsService.getArticles(pcode, limit);
  }

  @Get('search')
  @ApiOperation({ summary: '全文搜尋法規' })
  @ApiResponse({ status: 200, description: '搜尋結果' })
  async searchArticles(@Query() dto: SearchRegulationsDto) {
    return this.regulationsService.searchArticles(dto.query, dto.pcode, dto.limit);
  }

  @Get('materials/:category')
  @ApiOperation({ summary: '依材料類別取得相關法規' })
  @ApiResponse({ status: 200, description: '材料相關法規' })
  async getRegulationsByMaterial(@Param('category') category: string) {
    return this.regulationsService.getRegulationsByMaterial(category);
  }

  // ==========================================
  // CNS 標準 APIs
  // ==========================================

  @Get('cns')
  @ApiOperation({ summary: '查詢 CNS 標準' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'CNS 類別 (steel, concrete, board, etc.)',
  })
  @ApiQuery({ name: 'search', required: false, description: '搜尋關鍵字' })
  @ApiResponse({ status: 200, description: 'CNS 標準列表' })
  async getCnsStandards(@Query('category') category?: string, @Query('search') search?: string) {
    return this.regulationsService.getCnsStandards(category, search);
  }

  @Get('cns/categories')
  @ApiOperation({ summary: '取得 CNS 分類列表' })
  @ApiResponse({ status: 200, description: 'CNS 分類列表' })
  async getCnsCategories() {
    return this.regulationsService.getCnsCategories();
  }

  @Get('cns/:cnsNumber')
  @ApiOperation({ summary: '依編號取得 CNS 標準' })
  @ApiResponse({ status: 200, description: 'CNS 標準詳情' })
  async getCnsByNumber(@Param('cnsNumber') cnsNumber: string) {
    return this.regulationsService.getCnsByNumber(cnsNumber);
  }

  // ==========================================
  // AI 摘要 APIs
  // ==========================================

  @Get('ai/status')
  @ApiOperation({ summary: '取得 AI 服務狀態' })
  @ApiResponse({ status: 200, description: 'AI 服務狀態' })
  getAiStatus() {
    return {
      enabled: this.geminiAiService.isEnabled(),
      model: 'gemini-1.5-flash',
    };
  }

  @Post('ai/summary/article/:articleId')
  @ApiOperation({ summary: '產生法規條文 AI 摘要' })
  @ApiResponse({ status: 200, description: 'AI 摘要' })
  async generateArticleSummary(@Param('articleId') articleId: string) {
    const article = await this.regulationsService.getArticleById(articleId);
    if (!article) {
      return { error: 'Article not found' };
    }
    const summary = await this.geminiAiService.generateRegulationSummary(article.content);
    return { articleId, summary };
  }

  @Post('ai/summary/cns/:cnsNumber')
  @ApiOperation({ summary: '產生 CNS 標準 AI 摘要' })
  @ApiResponse({ status: 200, description: 'AI 摘要' })
  async generateCnsSummary(@Param('cnsNumber') cnsNumber: string) {
    const cns = await this.regulationsService.getCnsByNumber(cnsNumber);
    if (!cns) {
      return { error: 'CNS standard not found' };
    }
    const summary = await this.geminiAiService.generateCnsSummary(
      cns.cnsNumber,
      cns.title,
      cns.scope
    );
    return { cnsNumber, summary };
  }

  @Get('ai/suggest/:materialCategory')
  @ApiOperation({ summary: 'AI 建議相關法規' })
  @ApiResponse({ status: 200, description: '相關法規建議' })
  async suggestRelatedRegulations(@Param('materialCategory') materialCategory: string) {
    const suggestions = await this.geminiAiService.suggestRelatedRegulations(materialCategory);
    return { materialCategory, suggestions };
  }
}
