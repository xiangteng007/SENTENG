import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { AuthenticatedRequest } from "../../common/types";
import { InventoryService } from './inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  StockMovementDto,
  CreateMovementDto,
} from './inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions('inventory:read')
  async findAll() {
    return this.inventoryService.findAll();
  }

  @Get(':id')
  @RequirePermissions('inventory:read')
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Post()
  @RequirePermissions('inventory:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Put(':id')
  @RequirePermissions('inventory:update')
  async update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Delete(':id')
  @RequirePermissions('inventory:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.inventoryService.remove(id);
  }

  @Post(':id/stock-movement')
  @RequirePermissions('inventory:update')
  async stockMovement(@Param('id') id: string, @Body() stockMovementDto: StockMovementDto) {
    return this.inventoryService.stockMovement(
      id,
      stockMovementDto.type,
      stockMovementDto.quantity
    );
  }

  // =============================================
  // Movement Tracking Endpoints
  // =============================================

  @Post('movements')
  @RequirePermissions('inventory:create')
  @HttpCode(HttpStatus.CREATED)
  async addMovement(@Body() dto: CreateMovementDto, @Request() req: AuthenticatedRequest) {
    return this.inventoryService.addMovement(dto, req.user?.sub);
  }

  @Get(':id/movements')
  @RequirePermissions('inventory:read')
  async getMovements(@Param('id') id: string) {
    return this.inventoryService.getMovements(id);
  }

  @Get('projects/:projectId/movements')
  @RequirePermissions('inventory:read')
  async getProjectMovements(@Param('projectId') projectId: string) {
    return this.inventoryService.getMovementsByProject(projectId);
  }

  @Get('projects/:projectId/material-cost')
  @RequirePermissions('inventory:read')
  async getProjectMaterialCost(@Param('projectId') projectId: string) {
    return this.inventoryService.getProjectMaterialCost(projectId);
  }
}
