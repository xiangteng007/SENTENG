import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CostEntriesService } from './cost-entries.service';
import { CreateCostEntryDto, UpdateCostEntryDto, MarkPaidDto } from './cost-entry.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('cost-entries')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CostEntriesController {
  constructor(private readonly costEntriesService: CostEntriesService) {}

  @Get()
  @RequirePermissions('cost-entries:read')
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('contractId') contractId?: string,
    @Query('category') category?: string,
    @Query('isPaid') isPaid?: string
  ) {
    return this.costEntriesService.findAll({
      projectId,
      contractId,
      category,
      isPaid: isPaid === 'true' ? true : isPaid === 'false' ? false : undefined,
    });
  }

  @Get('summary/:projectId')
  @RequirePermissions('cost-entries:read')
  async getSummary(@Param('projectId') projectId: string) {
    return this.costEntriesService.getSummary(projectId);
  }

  @Get(':id')
  @RequirePermissions('cost-entries:read')
  async findOne(@Param('id') id: string) {
    return this.costEntriesService.findOne(id);
  }

  @Post()
  @RequirePermissions('cost-entries:create')
  async create(@Body() dto: CreateCostEntryDto, @Request() req: any) {
    return this.costEntriesService.create(dto, req.user?.id);
  }

  @Patch(':id')
  @RequirePermissions('cost-entries:update')
  async update(@Param('id') id: string, @Body() dto: UpdateCostEntryDto, @Request() req: any) {
    return this.costEntriesService.update(id, dto, req.user?.id);
  }

  @Post(':id/mark-paid')
  @RequirePermissions('cost-entries:update')
  async markPaid(@Param('id') id: string, @Body() dto: MarkPaidDto, @Request() req: any) {
    return this.costEntriesService.markPaid(id, dto, req.user?.id);
  }

  @Delete(':id')
  @RequirePermissions('cost-entries:delete')
  async delete(@Param('id') id: string) {
    await this.costEntriesService.delete(id);
    return { success: true };
  }
}
