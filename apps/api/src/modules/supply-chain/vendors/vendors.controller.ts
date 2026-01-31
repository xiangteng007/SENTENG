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
} from '@nestjs/common';
import type { AuthenticatedRequest } from "../../../common/types";
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto, VendorQueryDto, AddTradeDto } from './vendor.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('vendors')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @RequirePermissions('vendors:read')
  async findAll(@Query() query: VendorQueryDto, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role;
    return this.vendorsService.findAll(query, userId, userRole);
  }

  @Get(':id')
  @RequirePermissions('vendors:read')
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role;
    return this.vendorsService.findOne(id, userId, userRole);
  }

  @Get(':id/projects')
  @RequirePermissions('vendors:read')
  async findProjects(@Param('id') id: string) {
    return this.vendorsService.findProjects(id);
  }

  @Post()
  @RequirePermissions('vendors:create')
  async create(@Body() dto: CreateVendorDto, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.sub || req.user?.id;
    return this.vendorsService.create(dto, userId);
  }

  @Patch(':id')
  @RequirePermissions('vendors:update')
  async update(@Param('id') id: string, @Body() dto: UpdateVendorDto, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role;
    return this.vendorsService.update(id, dto, userId, userRole);
  }

  @Patch(':id/rating')
  @RequirePermissions('vendors:rate')
  async updateRating(@Param('id') id: string, @Body('rating') rating: number, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.sub || req.user?.id;
    return this.vendorsService.updateRating(id, rating, userId);
  }

  @Post(':id/blacklist')
  @RequirePermissions('vendors:blacklist')
  async blacklist(@Param('id') id: string, @Body('reason') reason: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.sub || req.user?.id;
    return this.vendorsService.blacklist(id, reason, userId);
  }

  @Post(':id/activate')
  @RequirePermissions('vendors:blacklist')
  async activate(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.sub || req.user?.id;
    return this.vendorsService.activate(id, userId);
  }

  @Delete(':id')
  @RequirePermissions('vendors:delete')
  async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role;
    return this.vendorsService.remove(id, userId, userRole);
  }

  // Trade endpoints
  @Post(':id/trades')
  @RequirePermissions('vendors:update')
  async addTrade(@Param('id') id: string, @Body() dto: AddTradeDto) {
    return this.vendorsService.addTrade(id, dto);
  }

  @Delete('trades/:tradeId')
  @RequirePermissions('vendors:update')
  async removeTrade(@Param('tradeId') tradeId: string) {
    return this.vendorsService.removeTrade(tradeId);
  }
}
