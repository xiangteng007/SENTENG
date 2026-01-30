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
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectQueryDto,
  CreatePhaseDto,
  AddVendorDto,
  CreateTaskDto,
} from './project.dto';
import { TaskStatus } from './project-task.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @RequirePermissions('projects:read')
  findAll(@Query() query: ProjectQueryDto, @Request() req: any) {
    return this.projectsService.findAll(query, req.user?.sub || req.user?.id, req.user?.role);
  }

  @Get(':id')
  @RequirePermissions('projects:read')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.findOne(id, req.user?.sub || req.user?.id, req.user?.role);
  }

  @Get(':id/vendors')
  @RequirePermissions('projects:read')
  findVendors(@Param('id') id: string) {
    return this.projectsService.findVendors(id);
  }

  @Get(':id/phases')
  @RequirePermissions('projects:read')
  findPhases(@Param('id') id: string) {
    return this.projectsService.findPhases(id);
  }

  @Get(':id/tasks')
  @RequirePermissions('projects:read')
  findTasks(@Param('id') id: string) {
    return this.projectsService.findTasks(id);
  }

  @Get(':id/costs')
  @RequirePermissions('projects:read')
  getCostSummary(@Param('id') id: string) {
    return this.projectsService.getCostSummary(id);
  }

  @Post()
  @RequirePermissions('projects:create')
  create(@Body() dto: CreateProjectDto, @Request() req: any) {
    return this.projectsService.create(dto, req.user?.sub || req.user?.id);
  }

  @Patch(':id')
  @RequirePermissions('projects:update')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @Request() req: any) {
    return this.projectsService.update(id, dto, req.user?.sub || req.user?.id);
  }

  @Delete(':id')
  @RequirePermissions('projects:delete')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  // Phase endpoints
  @Post(':id/phases')
  @RequirePermissions('projects:phases')
  addPhase(@Param('id') id: string, @Body() dto: CreatePhaseDto) {
    return this.projectsService.addPhase(id, dto);
  }

  @Delete('phases/:phaseId')
  @RequirePermissions('projects:phases')
  removePhase(@Param('phaseId') phaseId: string) {
    return this.projectsService.removePhase(phaseId);
  }

  // Vendor endpoints
  @Post(':id/vendors')
  @RequirePermissions('projects:vendors')
  addVendor(@Param('id') id: string, @Body() dto: AddVendorDto) {
    return this.projectsService.addVendor(id, dto);
  }

  @Delete('project-vendors/:pvId')
  @RequirePermissions('projects:vendors')
  removeVendor(@Param('pvId') pvId: string) {
    return this.projectsService.removeVendor(pvId);
  }

  // Task endpoints
  @Post(':id/tasks')
  @RequirePermissions('projects:tasks')
  addTask(@Param('id') id: string, @Body() dto: CreateTaskDto) {
    return this.projectsService.addTask(id, dto);
  }

  @Patch('tasks/:taskId/status')
  @RequirePermissions('projects:tasks')
  updateTaskStatus(@Param('taskId') taskId: string, @Body('status') status: TaskStatus) {
    return this.projectsService.updateTaskStatus(taskId, status);
  }

  @Delete('tasks/:taskId')
  @RequirePermissions('projects:tasks')
  removeTask(@Param('taskId') taskId: string) {
    return this.projectsService.removeTask(taskId);
  }
}
