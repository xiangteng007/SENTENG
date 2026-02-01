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
import { SiteLogsService } from "./site-logs.service";
import {
  CreateSiteLogDto,
  UpdateSiteLogDto,
  SiteLogQueryDto,
} from "./site-log.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

@ApiTags("Site Logs")
@ApiBearerAuth()
@Controller("site-logs")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SiteLogsController {
  constructor(private readonly siteLogsService: SiteLogsService) {}

  @Get()
  @ApiOperation({ summary: "List site logs" })
  @RequirePermissions("site-logs:read")
  findAll(@Query() query: SiteLogQueryDto) {
    return this.siteLogsService.findAll(query);
  }

  @Get("project/:projectId/summary")
  @ApiOperation({ summary: "Get project summary" })
  @RequirePermissions("site-logs:read")
  getProjectSummary(
    @Param("projectId") projectId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.siteLogsService.getProjectSummary(
      projectId,
      startDate,
      endDate,
    );
  }

  @Get(":id")
  @RequirePermissions("site-logs:read")
  findOne(@Param("id") id: string) {
    return this.siteLogsService.findOne(id);
  }

  @Post()
  @RequirePermissions("site-logs:create")
  create(@Body() dto: CreateSiteLogDto, @Request() req: AuthenticatedRequest) {
    return this.siteLogsService.create(dto, req.user?.sub || req.user?.id);
  }

  @Patch(":id")
  @RequirePermissions("site-logs:update")
  update(@Param("id") id: string, @Body() dto: UpdateSiteLogDto) {
    return this.siteLogsService.update(id, dto);
  }

  @Post(":id/submit")
  @RequirePermissions("site-logs:submit")
  submit(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.siteLogsService.submit(id, req.user?.sub || req.user?.id);
  }

  @Post(":id/approve")
  @RequirePermissions("site-logs:approve")
  approve(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.siteLogsService.approve(id, req.user?.sub || req.user?.id);
  }

  @Post(":id/reject")
  @RequirePermissions("site-logs:approve")
  reject(@Param("id") id: string, @Body("reason") reason: string) {
    return this.siteLogsService.reject(id, reason);
  }

  @Delete(":id")
  @RequirePermissions("site-logs:delete")
  remove(@Param("id") id: string) {
    return this.siteLogsService.remove(id);
  }
}
