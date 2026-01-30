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
  UseInterceptors,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './client.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import {
  Deprecated,
  DeprecationInterceptor,
} from '../../common/interceptors/deprecation.interceptor';

/**
 * @deprecated This API is deprecated. Please migrate to /api/v1/customers
 * Sunset date: 2026-06-01
 */
@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(DeprecationInterceptor)
@Deprecated(
  'The /clients API is deprecated. Please migrate to /customers API which offers enhanced CRM features.',
  'Sat, 01 Jun 2026 00:00:00 GMT'
)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @RequirePermissions('clients:read')
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    return this.clientsService.findAll({ page, limit, status, search });
  }

  @Get('export/excel')
  @RequirePermissions('clients:read')
  async exportExcel(
    @Query('status') status: string,
    @Query('search') search: string,
    @Query('format') format: 'xlsx' | 'csv',
    @Request() req: any,
    @Res() res: Response
  ) {
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role;
    const buffer = await this.clientsService.exportToExcel(
      { status, search, format },
      userId,
      userRole
    );

    const fileFormat = format || 'xlsx';
    const filename = `clients_${new Date().toISOString().slice(0, 10)}.${fileFormat}`;

    if (fileFormat === 'csv') {
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

  @Get(':id')
  @RequirePermissions('clients:read')
  async findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @RequirePermissions('clients:create')
  async create(@Body() dto: CreateClientDto, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.clientsService.create(dto, userId);
  }

  @Patch(':id')
  @RequirePermissions('clients:update')
  async update(@Param('id') id: string, @Body() dto: UpdateClientDto, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.clientsService.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('clients:delete')
  async remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
