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
  Res,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../../common/types";
import type { Response } from "express";
import { QuotationsService } from "./quotations.service";
import { CreateQuotationDto, UpdateQuotationDto } from "./quotation.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

@ApiTags("Quotations")
@ApiBearerAuth()
@Controller("quotations")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get()
  @RequirePermissions("quotations:read")
  async findAll(
    @Query("projectId") projectId?: string,
    @Query("status") status?: string,
  ) {
    return this.quotationsService.findAll({ projectId, status });
  }

  /**
   * Export quotations to Excel/CSV
   * GET /api/v1/quotations/export/excel?format=xlsx|csv
   */
  @Get("export/excel")
  @RequirePermissions("quotations:read")
  async exportExcel(
    @Query("projectId") projectId: string,
    @Query("status") status: string,
    @Query("format") format: "xlsx" | "csv",
    @Res() res: Response,
  ) {
    const buffer = await this.quotationsService.exportToExcel({
      projectId,
      status,
      format,
    });

    const fileFormat = format || "xlsx";
    const filename = `quotations_${new Date().toISOString().slice(0, 10)}.${fileFormat}`;

    if (fileFormat === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
    } else {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    }
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(":id")
  @RequirePermissions("quotations:read")
  async findOne(@Param("id") id: string) {
    return this.quotationsService.findOne(id);
  }

  @Get(":id/versions")
  @RequirePermissions("quotations:read")
  async getVersions(@Param("id") id: string) {
    return this.quotationsService.getVersions(id);
  }

  @Post()
  @RequirePermissions("quotations:create")
  async create(
    @Body() dto: CreateQuotationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.quotationsService.create(dto, req.user?.id);
  }

  @Patch(":id")
  @RequirePermissions("quotations:update")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateQuotationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.quotationsService.update(id, dto, req.user?.id);
  }

  @Post(":id/submit")
  @RequirePermissions("quotations:submit")
  async submit(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.quotationsService.submit(id, req.user?.id);
  }

  @Post(":id/approve")
  @RequirePermissions("quotations:approve")
  async approve(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.quotationsService.approve(id, req.user?.id);
  }

  @Post(":id/reject")
  @RequirePermissions("quotations:reject")
  async reject(
    @Param("id") id: string,
    @Body("reason") reason: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.quotationsService.reject(id, reason, req.user?.id);
  }

  @Post(":id/new-version")
  @RequirePermissions("quotations:create")
  async createNewVersion(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.quotationsService.createNewVersion(id, req.user?.id);
  }
}
