import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto, CreateReceiptDto } from './payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermissions('payments:read')
  async findAll(
    @Query('contractId') contractId?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string
  ) {
    return this.paymentsService.findAll({ contractId, projectId, status });
  }

  @Get(':id')
  @RequirePermissions('payments:read')
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Get(':id/receipts')
  @RequirePermissions('payments:read')
  async getReceipts(@Param('id') id: string) {
    return this.paymentsService.getReceipts(id);
  }

  @Post()
  @RequirePermissions('payments:create')
  async create(@Body() dto: CreatePaymentDto, @Request() req: any) {
    return this.paymentsService.create(dto, req.user?.id);
  }

  @Post('receipts')
  @RequirePermissions('payments:create')
  async addReceipt(@Body() dto: CreateReceiptDto, @Request() req: any) {
    return this.paymentsService.addReceipt(dto, req.user?.id);
  }

  @Patch(':id')
  @RequirePermissions('payments:update')
  async update(@Param('id') id: string, @Body() dto: UpdatePaymentDto, @Request() req: any) {
    return this.paymentsService.update(id, dto, req.user?.id);
  }

  @Post(':id/submit')
  @RequirePermissions('payments:submit')
  async submit(@Param('id') id: string, @Request() req: any) {
    return this.paymentsService.submit(id, req.user?.id);
  }

  @Post(':id/approve')
  @RequirePermissions('payments:approve')
  async approve(@Param('id') id: string, @Request() req: any) {
    return this.paymentsService.approve(id, req.user?.id);
  }

  @Post(':id/reject')
  @RequirePermissions('payments:reject')
  async reject(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
    return this.paymentsService.reject(id, reason, req.user?.id);
  }
}
