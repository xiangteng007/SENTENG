import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import type { Response } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { BiExportService, DateRangeDto } from "./bi-export.service";

@ApiTags("Reports")
@ApiBearerAuth()
@Controller("reports")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ReportsController {
  constructor(private readonly biExportService: BiExportService) {}

  @Get("dashboard")
  @RequirePermissions("reports:read")
  async getDashboardMetrics() {
    return this.biExportService.getDashboardMetrics();
  }

  @Get("revenue-by-month")
  @RequirePermissions("reports:read")
  async getRevenueByMonth() {
    return this.biExportService.getRevenueByMonth();
  }

  @Get("project-status")
  @RequirePermissions("reports:read")
  async getProjectStatusDistribution() {
    return this.biExportService.getProjectStatusDistribution();
  }

  @Get("top-clients")
  @RequirePermissions("reports:read")
  async getTopClients() {
    return this.biExportService.getTopClientsByRevenue();
  }

  @Get("export/projects")
  @RequirePermissions("reports:export")
  async exportProjects(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("format") format: "json" | "csv" = "json",
    @Res({ passthrough: true }) res?: Response,
  ) {
    const dateRange: DateRangeDto | undefined =
      startDate && endDate ? { startDate, endDate } : undefined;

    const data = await this.biExportService.exportProjectsReport(dateRange);

    if (format === "csv" && res) {
      return this.biExportService.exportToCsv(data, res, "projects-report.csv");
    }

    return data;
  }

  @Get("export/finance")
  @RequirePermissions("reports:export")
  async exportFinance(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("format") format: "json" | "csv" = "json",
    @Res({ passthrough: true }) res?: Response,
  ) {
    const data = await this.biExportService.exportFinanceReport({
      startDate,
      endDate,
    });

    if (format === "csv" && res) {
      return this.biExportService.exportToCsv(data, res, "finance-report.csv");
    }

    return data;
  }
}
