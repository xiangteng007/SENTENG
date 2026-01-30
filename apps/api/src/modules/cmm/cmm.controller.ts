import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

import { CmmService } from './cmm.service';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  MaterialQueryDto,
  CalculateRequestDto as LegacyCalculateRequestDto,
  CalculateResponseDto,
} from './dto';
import {
  RunCalculationRequestDto,
  CalculationResultDto,
  ListRunsQueryDto,
  TaxonomyResponseDto,
} from './dto/calculation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('CMM - 物料估算')
@Controller('cmm')
export class CmmController {
  constructor(private readonly cmmService: CmmService) {}

  // ==================== Taxonomy (營建/裝潢分類) ====================

  @Get('taxonomy')
  @ApiOperation({ summary: '取得分類體系' })
  @ApiResponse({ status: 200, description: '分類體系樹狀結構' })
  async getTaxonomy(): Promise<TaxonomyResponseDto> {
    return this.cmmService.getTaxonomy();
  }

  @Get('taxonomy/:l1Code')
  @ApiOperation({ summary: '取得指定頂層分類的子分類' })
  @ApiParam({
    name: 'l1Code',
    description: '頂層分類代碼 (CONSTRUCTION/INTERIOR)',
  })
  async getTaxonomyByL1(@Param('l1Code') l1Code: string) {
    return this.cmmService.getTaxonomyByL1(l1Code);
  }

  // ==================== Calculation Runs (計算執行) ====================

  @Post('runs')
  @ApiOperation({ summary: '執行計算並儲存記錄' })
  @ApiResponse({
    status: 201,
    description: '計算結果',
    type: CalculationResultDto,
  })
  async executeCalculation(@Body() dto: RunCalculationRequestDto): Promise<CalculationResultDto> {
    return this.cmmService.executeCalculationRun(dto);
  }

  @Get('runs')
  @ApiOperation({ summary: '查詢計算歷史' })
  @ApiResponse({ status: 200, description: '計算記錄列表' })
  async listRuns(@Query() query: ListRunsQueryDto) {
    return this.cmmService.listCalculationRuns(query);
  }

  @Get('runs/:runId')
  @ApiOperation({ summary: '取得計算結果' })
  @ApiParam({ name: 'runId', description: '計算執行 ID' })
  @ApiResponse({
    status: 200,
    description: '計算結果',
    type: CalculationResultDto,
  })
  async getRunResult(@Param('runId', ParseUUIDPipe) runId: string): Promise<CalculationResultDto> {
    return this.cmmService.getCalculationRunResult(runId);
  }

  // ==================== Rule Sets (規則集) ====================

  @Get('rulesets')
  @ApiOperation({ summary: '取得規則集列表' })
  async listRuleSets() {
    return this.cmmService.listRuleSets();
  }

  @Get('rulesets/current')
  @ApiOperation({ summary: '取得當前規則集' })
  async getCurrentRuleSet() {
    return this.cmmService.getCurrentRuleSet();
  }

  // ==================== Materials ====================

  @Get('materials')
  @ApiOperation({ summary: '取得物料清單' })
  @ApiResponse({ status: 200, description: '物料清單' })
  async getMaterials(@Query() query: MaterialQueryDto) {
    return this.cmmService.findAllMaterials(query);
  }

  @Get('materials/:id')
  @ApiOperation({ summary: '取得物料詳情' })
  @ApiParam({ name: 'id', description: '物料 ID' })
  @ApiResponse({ status: 200, description: '物料詳情' })
  @ApiResponse({ status: 404, description: '物料不存在' })
  async getMaterial(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmmService.findMaterialById(id);
  }

  @Post('materials')
  @ApiOperation({ summary: '新增物料' })
  @ApiResponse({ status: 201, description: '物料已建立' })
  @ApiResponse({ status: 409, description: '物料代碼已存在' })
  async createMaterial(@Body() dto: CreateMaterialDto) {
    return this.cmmService.createMaterial(dto);
  }

  @Put('materials/:id')
  @ApiOperation({ summary: '更新物料' })
  @ApiParam({ name: 'id', description: '物料 ID' })
  @ApiResponse({ status: 200, description: '物料已更新' })
  @ApiResponse({ status: 404, description: '物料不存在' })
  async updateMaterial(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMaterialDto) {
    return this.cmmService.updateMaterial(id, dto);
  }

  @Delete('materials/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '刪除物料' })
  @ApiParam({ name: 'id', description: '物料 ID' })
  @ApiResponse({ status: 204, description: '物料已刪除' })
  @ApiResponse({ status: 404, description: '物料不存在' })
  async deleteMaterial(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmmService.deleteMaterial(id);
  }

  // ==================== Building Profiles ====================

  @Get('profiles')
  @ApiOperation({ summary: '取得建築參數清單' })
  @ApiResponse({ status: 200, description: '建築參數清單' })
  async getProfiles() {
    return this.cmmService.findAllProfiles();
  }

  @Get('profiles/:code')
  @ApiOperation({ summary: '取得建築參數詳情' })
  @ApiParam({ name: 'code', description: '建築參數代碼' })
  @ApiResponse({ status: 200, description: '建築參數詳情' })
  @ApiResponse({ status: 404, description: '參數不存在' })
  async getProfile(@Param('code') code: string) {
    return this.cmmService.findProfileByCode(code);
  }

  // ==================== Legacy Calculation (舊版計算) ====================

  @Post('calculate')
  @ApiOperation({ summary: '執行物料計算（不儲存，舊版相容）' })
  @ApiResponse({
    status: 200,
    description: '計算結果',
    type: CalculateResponseDto,
  })
  async calculate(@Body() dto: LegacyCalculateRequestDto): Promise<CalculateResponseDto> {
    return this.cmmService.calculate({ ...dto, save: false });
  }

  @Post('calculate/save')
  @ApiOperation({ summary: '執行物料計算並儲存（舊版相容）' })
  @ApiResponse({
    status: 201,
    description: '計算結果已儲存',
    type: CalculateResponseDto,
  })
  async calculateAndSave(@Body() dto: LegacyCalculateRequestDto): Promise<CalculateResponseDto> {
    return this.cmmService.calculate({ ...dto, save: true });
  }

  // ==================== Unit Conversion ====================

  @Get('materials/:id/convert')
  @ApiOperation({ summary: '物料單位換算' })
  @ApiParam({ name: 'id', description: '物料 ID' })
  @ApiQuery({ name: 'from', description: '來源單位' })
  @ApiQuery({ name: 'to', description: '目標單位' })
  @ApiQuery({ name: 'value', description: '數值' })
  @ApiResponse({ status: 200, description: '換算結果' })
  async convertUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('value') value: number
  ) {
    return this.cmmService.convertUnit(id, from, to, Number(value));
  }

  // ==================== Admin (資料管理) ====================

  @Post('seed')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('cmm:admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '初始化 CMM 預設資料' })
  @ApiResponse({ status: 200, description: '初始化結果統計' })
  async seedDefaultData() {
    return this.cmmService.seedDefaultData();
  }
}
