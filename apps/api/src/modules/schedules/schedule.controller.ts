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
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ScheduleService } from "./schedule.service";
import {
  CreateScheduleTaskDto,
  UpdateScheduleTaskDto,
  ScheduleTaskQueryDto,
  CreateDependencyDto,
  CreateMilestoneDto,
  UpdateMilestoneDto,
} from "./schedule.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

@ApiTags("Schedules")
@ApiBearerAuth()
@Controller("schedules")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // === Gantt Chart ===

  @Get("gantt/:projectId")
  @ApiOperation({ summary: "Get Gantt chart data" })
  @RequirePermissions("schedules:read")
  async getGanttData(@Param("projectId") projectId: string) {
    return this.scheduleService.getGanttData(projectId);
  }

  @Get("critical-path/:projectId")
  @ApiOperation({ summary: "Get critical path" })
  @RequirePermissions("schedules:read")
  async getCriticalPath(@Param("projectId") projectId: string) {
    return this.scheduleService.getCriticalPath(projectId);
  }

  // === Tasks ===

  @Get("tasks")
  @RequirePermissions("schedules:read")
  async findTasks(@Query() query: ScheduleTaskQueryDto) {
    return this.scheduleService.findTasks(query);
  }

  @Get("tasks/:id")
  @RequirePermissions("schedules:read")
  async findTaskById(@Param("id") id: string) {
    return this.scheduleService.findTaskById(id);
  }

  @Post("tasks")
  @RequirePermissions("schedules:create")
  async createTask(@Body() dto: CreateScheduleTaskDto) {
    return this.scheduleService.createTask(dto);
  }

  @Patch("tasks/:id")
  @RequirePermissions("schedules:update")
  async updateTask(
    @Param("id") id: string,
    @Body() dto: UpdateScheduleTaskDto,
  ) {
    return this.scheduleService.updateTask(id, dto);
  }

  @Patch("tasks/:id/progress")
  @RequirePermissions("schedules:update")
  async updateTaskProgress(
    @Param("id") id: string,
    @Body() body: { progress: number },
  ) {
    return this.scheduleService.updateTaskProgress(id, body.progress);
  }

  @Delete("tasks/:id")
  @RequirePermissions("schedules:delete")
  async deleteTask(@Param("id") id: string) {
    await this.scheduleService.deleteTask(id);
    return { success: true };
  }

  // === Dependencies ===

  @Get("dependencies/:projectId")
  @RequirePermissions("schedules:read")
  async getDependencies(@Param("projectId") projectId: string) {
    return this.scheduleService.getDependencies(projectId);
  }

  @Post("dependencies")
  @RequirePermissions("schedules:create")
  async createDependency(@Body() dto: CreateDependencyDto) {
    return this.scheduleService.createDependency(dto);
  }

  @Delete("dependencies/:id")
  @RequirePermissions("schedules:delete")
  async deleteDependency(@Param("id") id: string) {
    await this.scheduleService.deleteDependency(id);
    return { success: true };
  }

  // === Milestones ===

  @Get("milestones/:projectId")
  @RequirePermissions("schedules:read")
  async getMilestones(@Param("projectId") projectId: string) {
    return this.scheduleService.getMilestones(projectId);
  }

  @Get("milestone/:id")
  @RequirePermissions("schedules:read")
  async getMilestoneById(@Param("id") id: string) {
    return this.scheduleService.getMilestoneById(id);
  }

  @Post("milestones")
  @RequirePermissions("schedules:create")
  async createMilestone(@Body() dto: CreateMilestoneDto) {
    return this.scheduleService.createMilestone(dto);
  }

  @Patch("milestones/:id")
  @RequirePermissions("schedules:update")
  async updateMilestone(
    @Param("id") id: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.scheduleService.updateMilestone(id, dto);
  }

  @Patch("milestones/:id/complete")
  @RequirePermissions("schedules:update")
  async completeMilestone(@Param("id") id: string) {
    return this.scheduleService.completeMilestone(id);
  }

  @Delete("milestones/:id")
  @RequirePermissions("schedules:delete")
  async deleteMilestone(@Param("id") id: string) {
    await this.scheduleService.deleteMilestone(id);
    return { success: true };
  }
}
