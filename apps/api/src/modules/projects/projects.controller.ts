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
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../../common/types";
import { ProjectsService } from "./projects.service";
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectQueryDto,
  CreatePhaseDto,
  AddVendorDto,
  CreateTaskDto,
} from "./project.dto";
import { TaskStatus } from "./project-task.entity";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

@ApiTags("Projects")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({
    summary: "List projects",
    description: "Get paginated list of projects with filtering",
  })
  @RequirePermissions("projects:read")
  findAll(
    @Query() query: ProjectQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.projectsService.findAll(
      query,
      req.user?.sub || req.user?.id,
      req.user?.role,
    );
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get project",
    description: "Get project details by ID",
  })
  @RequirePermissions("projects:read")
  findOne(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.projectsService.findOne(
      id,
      req.user?.sub || req.user?.id,
      req.user?.role,
    );
  }

  @Get(":id/vendors")
  @ApiOperation({ summary: "List project vendors" })
  @RequirePermissions("projects:read")
  findVendors(@Param("id") id: string) {
    return this.projectsService.findVendors(id);
  }

  @Get(":id/phases")
  @ApiOperation({ summary: "List project phases" })
  @RequirePermissions("projects:read")
  findPhases(@Param("id") id: string) {
    return this.projectsService.findPhases(id);
  }

  @Get(":id/tasks")
  @ApiOperation({ summary: "List project tasks" })
  @RequirePermissions("projects:read")
  findTasks(@Param("id") id: string) {
    return this.projectsService.findTasks(id);
  }

  @Get(":id/costs")
  @ApiOperation({
    summary: "Get cost summary",
    description: "Get project cost breakdown and totals",
  })
  @RequirePermissions("projects:read")
  getCostSummary(@Param("id") id: string) {
    return this.projectsService.getCostSummary(id);
  }

  @Post()
  @ApiOperation({ summary: "Create project" })
  @RequirePermissions("projects:create")
  create(@Body() dto: CreateProjectDto, @Request() req: AuthenticatedRequest) {
    return this.projectsService.create(dto, req.user?.sub || req.user?.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update project" })
  @RequirePermissions("projects:update")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProjectDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.projectsService.update(id, dto, req.user?.sub || req.user?.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete project" })
  @RequirePermissions("projects:delete")
  remove(@Param("id") id: string) {
    return this.projectsService.remove(id);
  }

  // Phase endpoints
  @Post(":id/phases")
  @ApiOperation({
    summary: "Add phase",
    description: "Add a new phase to the project",
  })
  @RequirePermissions("projects:phases")
  addPhase(@Param("id") id: string, @Body() dto: CreatePhaseDto) {
    return this.projectsService.addPhase(id, dto);
  }

  @Delete("phases/:phaseId")
  @ApiOperation({ summary: "Remove phase" })
  @RequirePermissions("projects:phases")
  removePhase(@Param("phaseId") phaseId: string) {
    return this.projectsService.removePhase(phaseId);
  }

  // Vendor endpoints
  @Post(":id/vendors")
  @ApiOperation({
    summary: "Add vendor",
    description: "Assign a vendor to the project",
  })
  @RequirePermissions("projects:vendors")
  addVendor(@Param("id") id: string, @Body() dto: AddVendorDto) {
    return this.projectsService.addVendor(id, dto);
  }

  @Delete("project-vendors/:pvId")
  @ApiOperation({ summary: "Remove vendor" })
  @RequirePermissions("projects:vendors")
  removeVendor(@Param("pvId") pvId: string) {
    return this.projectsService.removeVendor(pvId);
  }

  // Task endpoints
  @Post(":id/tasks")
  @ApiOperation({
    summary: "Add task",
    description: "Create a new task for the project",
  })
  @RequirePermissions("projects:tasks")
  addTask(@Param("id") id: string, @Body() dto: CreateTaskDto) {
    return this.projectsService.addTask(id, dto);
  }

  @Patch("tasks/:taskId/status")
  @ApiOperation({ summary: "Update task status" })
  @RequirePermissions("projects:tasks")
  updateTaskStatus(
    @Param("taskId") taskId: string,
    @Body("status") status: TaskStatus,
  ) {
    return this.projectsService.updateTaskStatus(taskId, status);
  }

  @Delete("tasks/:taskId")
  @ApiOperation({ summary: "Remove task" })
  @RequirePermissions("projects:tasks")
  removeTask(@Param("taskId") taskId: string) {
    return this.projectsService.removeTask(taskId);
  }
}
