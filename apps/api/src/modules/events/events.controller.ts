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
import type { AuthenticatedRequest } from "../../common/types";
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, QueryEventsDto } from './event.dto';

@Controller('events')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions('events:read')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll(@Query() query: QueryEventsDto) {
    return this.eventsService.findAll(query);
  }

  @Get('today')
  async findToday() {
    return this.eventsService.findToday();
  }

  @Get('upcoming')
  async findUpcoming(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.eventsService.findUpcoming(daysNum);
  }

  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string) {
    return this.eventsService.findByProject(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @RequirePermissions('events:create')
  async create(@Body() dto: CreateEventDto, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    return this.eventsService.create(dto, userId);
  }

  @Patch(':id')
  @RequirePermissions('events:update')
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    return this.eventsService.update(id, dto, userId);
  }

  @Post(':id/complete')
  @RequirePermissions('events:update')
  async complete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    return this.eventsService.complete(id, userId);
  }

  @Post(':id/cancel')
  @RequirePermissions('events:update')
  async cancel(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    return this.eventsService.cancel(id, userId);
  }

  @Delete(':id')
  @RequirePermissions('events:delete')
  async remove(@Param('id') id: string) {
    await this.eventsService.remove(id);
    return { success: true, message: '事件已刪除' };
  }
}
