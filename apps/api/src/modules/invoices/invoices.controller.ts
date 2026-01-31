import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/types';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceDto, QueryInvoiceDto, InvoiceState } from './invoice.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExportExcelDto, Export401Dto, ExportPdfDto, ExportFormat } from './invoice-export.dto';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  /**
   * 查詢發票列表
   * GET /api/v1/invoices?page=1&limit=20&search=xxx&docType=INVOICE_B2B
   */
  @Get()
  async findAll(@Query() query: QueryInvoiceDto, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    return this.invoicesService.findAll(query, userId, userRole);
  }

  /**
   * 取得統計數據
   * GET /api/v1/invoices/stats
   */
  @Get('stats')
  async getStats(@Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    return this.invoicesService.getStats(userId, userRole);
  }

  /**
   * 取得月度統計
   * GET /api/v1/invoices/stats/monthly?year=2026&month=1
   */
  @Get('stats/monthly')
  async getMonthlyStats(
    @Query('year') year: string,
    @Query('month') month: string,
    @Request() req: AuthenticatedRequest
  ) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return this.invoicesService.getMonthlyStats(y, m, userId, userRole);
  }

  // ==================== 匯出端點 ====================

  /**
   * 匯出 Excel/CSV
   * GET /api/v1/invoices/export/excel?format=xlsx|csv&...filters
   */
  @Get('export/excel')
  async exportExcel(@Query() query: ExportExcelDto, @Request() req: AuthenticatedRequest, @Res() res: Response) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const buffer = await this.invoicesService.exportToExcel(query, userId, userRole);

    const format = query.format || ExportFormat.XLSX;
    const filename = `invoices_${new Date().toISOString().slice(0, 10)}.${format}`;

    if (format === ExportFormat.CSV) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    } else {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    }
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  /**
   * 匯出 401 申報格式
   * GET /api/v1/invoices/export/401?period=1-2&buyerTaxId=12345678
   */
  @Get('export/401')
  async export401(@Query() query: Export401Dto, @Request() req: AuthenticatedRequest, @Res() res: Response) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const content = await this.invoicesService.exportTo401(query, userId, userRole);

    const filename = `401_${query.period}_${new Date().toISOString().slice(0, 10)}.txt`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }

  /**
   * 匯出 PDF 報表
   * GET /api/v1/invoices/export/pdf?...filters
   */
  @Get('export/pdf')
  async exportPdf(@Query() query: ExportPdfDto, @Request() req: AuthenticatedRequest, @Res() res: Response) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const buffer = await this.invoicesService.exportToPdf(query, userId, userRole);

    const filename = `invoices_${new Date().toISOString().slice(0, 10)}.txt`;

    // Note: For proper PDF, integrate pdfmake with Chinese font support
    // Currently returning text format
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  /**
   * 取得單一發票
   * GET /api/v1/invoices/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    return this.invoicesService.findOne(id, userId, userRole);
  }

  /**
   * 建立發票
   * POST /api/v1/invoices
   */
  @Post()
  async create(@Body() dto: CreateInvoiceDto, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    return this.invoicesService.create(dto, userId);
  }

  /**
   * 更新發票
   * PATCH /api/v1/invoices/:id
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    return this.invoicesService.update(id, dto, userId, userRole);
  }

  /**
   * 變更狀態
   * POST /api/v1/invoices/:id/state
   */
  @Post(':id/state')
  async changeState(
    @Param('id') id: string,
    @Body('state') state: InvoiceState,
    @Request() req: AuthenticatedRequest
  ) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    return this.invoicesService.changeState(id, state, userId, userRole);
  }

  /**
   * 送審
   * POST /api/v1/invoices/:id/submit
   */
  @Post(':id/submit')
  async submit(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    return this.invoicesService.changeState(id, InvoiceState.PENDING_APPROVAL, userId, userRole);
  }

  /**
   * 核准
   * POST /api/v1/invoices/:id/approve
   */
  @Post(':id/approve')
  async approve(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    return this.invoicesService.changeState(id, InvoiceState.APPROVED, userId, userRole);
  }

  /**
   * 退回
   * POST /api/v1/invoices/:id/reject
   */
  @Post(':id/reject')
  async reject(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    return this.invoicesService.changeState(id, InvoiceState.REJECTED, userId, userRole);
  }

  /**
   * 記錄付款
   * POST /api/v1/invoices/:id/payment
   */
  @Post(':id/payment')
  async recordPayment(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Request() req: AuthenticatedRequest
  ) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    return this.invoicesService.recordPayment(id, amount, userId, userRole);
  }

  /**
   * 作廢
   * POST /api/v1/invoices/:id/void
   */
  @Post(':id/void')
  async void(@Param('id') id: string, @Body('reason') reason: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    return this.invoicesService.void(id, reason, userId, userRole);
  }

  /**
   * 刪除 (軟刪除)
   * DELETE /api/v1/invoices/:id
   */
  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    await this.invoicesService.softDelete(id, userId, userRole);
    return { success: true, message: 'Invoice deleted' };
  }
}
