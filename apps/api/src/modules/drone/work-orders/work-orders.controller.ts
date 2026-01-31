import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { AuthenticatedRequest } from "../../../common/types";
import { WorkOrdersService } from './work-orders.service';
import {
  CreateWorkOrderDto,
  CompleteWorkOrderDto,
  ScheduleWorkOrderDto,
  CancelWorkOrderDto,
} from './dto/work-order.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('drone/work-orders')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  @RequirePermissions('work-orders:read')
  findAll(
    @Query('projectId') projectId?: string,
    @Query('clientId') clientId?: string,
    @Query('businessUnitId') businessUnitId?: string,
    @Query('status') status?: string
  ) {
    return this.workOrdersService.findAll({
      projectId,
      clientId,
      businessUnitId,
      status,
    });
  }

  @Get('generate-number')
  @RequirePermissions('work-orders:create')
  generateNumber() {
    return this.workOrdersService.generateWoNumber();
  }

  @Get(':id')
  @RequirePermissions('work-orders:read')
  findById(@Param('id') id: string) {
    return this.workOrdersService.findById(id);
  }

  @Post()
  @RequirePermissions('work-orders:create')
  create(@Body() dto: CreateWorkOrderDto, @Request() req: AuthenticatedRequest) {
    return this.workOrdersService.create(dto, req.user?.sub);
  }

  @Patch(':id/schedule')
  @RequirePermissions('work-orders:update')
  schedule(@Param('id') id: string, @Body() body: ScheduleWorkOrderDto) {
    return this.workOrdersService.schedule(
      id,
      new Date(body.scheduledDate),
      body.timeStart,
      body.timeEnd
    );
  }

  @Patch(':id/dispatch')
  @RequirePermissions('work-orders:update')
  dispatch(@Param('id') id: string) {
    return this.workOrdersService.dispatch(id);
  }

  @Patch(':id/start')
  @RequirePermissions('work-orders:update')
  startWork(@Param('id') id: string) {
    return this.workOrdersService.startWork(id);
  }

  @Patch(':id/complete')
  @RequirePermissions('work-orders:update')
  complete(@Param('id') id: string, @Body() dto: CompleteWorkOrderDto, @Request() req: AuthenticatedRequest) {
    return this.workOrdersService.complete(id, dto, req.user?.sub);
  }

  @Patch(':id/cancel')
  @RequirePermissions('work-orders:delete')
  cancel(@Param('id') id: string, @Body() body: CancelWorkOrderDto) {
    return this.workOrdersService.cancel(id, body.reason);
  }
}
