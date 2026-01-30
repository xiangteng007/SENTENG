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
import { ChangeOrdersService } from './change-orders.service';
import { CreateChangeOrderDto, UpdateChangeOrderDto } from './change-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('change-orders')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ChangeOrdersController {
  constructor(private readonly changeOrdersService: ChangeOrdersService) {}

  @Get()
  @RequirePermissions('change-orders:read')
  async findAll(
    @Query('contractId') contractId?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string
  ) {
    return this.changeOrdersService.findAll({ contractId, projectId, status });
  }

  @Get(':id')
  @RequirePermissions('change-orders:read')
  async findOne(@Param('id') id: string) {
    return this.changeOrdersService.findOne(id);
  }

  @Post()
  @RequirePermissions('change-orders:create')
  async create(@Body() dto: CreateChangeOrderDto, @Request() req: any) {
    return this.changeOrdersService.create(dto, req.user?.id);
  }

  @Patch(':id')
  @RequirePermissions('change-orders:update')
  async update(@Param('id') id: string, @Body() dto: UpdateChangeOrderDto, @Request() req: any) {
    return this.changeOrdersService.update(id, dto, req.user?.id);
  }

  @Post(':id/submit')
  @RequirePermissions('change-orders:submit')
  async submit(@Param('id') id: string, @Request() req: any) {
    return this.changeOrdersService.submit(id, req.user?.id);
  }

  @Post(':id/approve')
  @RequirePermissions('change-orders:approve')
  async approve(@Param('id') id: string, @Request() req: any) {
    return this.changeOrdersService.approve(id, req.user?.id);
  }

  @Post(':id/reject')
  @RequirePermissions('change-orders:reject')
  async reject(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
    return this.changeOrdersService.reject(id, reason, req.user?.id);
  }
}
