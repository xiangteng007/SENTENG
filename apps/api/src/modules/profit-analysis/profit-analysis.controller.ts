import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ProfitAnalysisService } from "./profit-analysis.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

@Controller("profit-analysis")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProfitAnalysisController {
  constructor(private readonly profitService: ProfitAnalysisService) {}

  @Get("dashboard")
  @RequirePermissions("profit-analysis:read")
  async getDashboard() {
    return this.profitService.getDashboard();
  }

  @Get("projects/:projectId")
  @RequirePermissions("profit-analysis:read")
  async getProjectProfit(@Param("projectId") projectId: string) {
    return this.profitService.getProjectProfit(projectId);
  }
}
