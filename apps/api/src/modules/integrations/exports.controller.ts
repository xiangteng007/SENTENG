/**
 * exports.controller.ts
 *
 * 匯出功能控制器
 * 處理估價單匯出到 Google Sheets
 */

import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  GoogleSheetsService,
  ExportEstimateRequest,
  ExportEstimateResponse,
} from './google-sheets.service';

class ExportToSheetsDto {
  estimateLines: {
    id: string;
    categoryL1: string;
    categoryL2: string;
    name: string;
    spec: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    note?: string;
  }[];
  options?: {
    title?: string;
    projectName?: string;
    includeMetadata?: boolean;
  };
}

class ExportResponseDto {
  sheetId: string;
  sheetUrl: string;
  createdAt: string;
}

@ApiTags('Exports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v2/exports')
export class ExportsController {
  constructor(private readonly googleSheetsService: GoogleSheetsService) {}

  @Post('google-sheets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '匯出估價單到 Google Sheets' })
  @ApiResponse({
    status: 200,
    description: '匯出成功',
    type: ExportResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '未授權或 Google 帳號未連結',
  })
  async exportToGoogleSheets(
    @Request() req,
    @Body() dto: ExportToSheetsDto
  ): Promise<ExportEstimateResponse> {
    const userId = req.user.id || req.user.userId || req.user.sub;

    return this.googleSheetsService.exportEstimate(userId, {
      estimateLines: dto.estimateLines,
      options: dto.options,
    });
  }
}
