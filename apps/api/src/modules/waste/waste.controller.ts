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
  Req,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { WasteService } from "./waste.service";
import {
  CreateWasteRecordDto,
  UpdateWasteRecordDto,
  WasteRecordQueryDto,
  GenerateMonthlyReportDto,
  SubmitMonthlyReportDto,
} from "./waste.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

interface AuthRequest {
  user?: { id: string };
}

@ApiTags("Waste Management")
@ApiBearerAuth()
@Controller("waste")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class WasteController {
  constructor(private readonly wasteService: WasteService) {}

  // === Records ===

  @Get("records")
  @ApiOperation({ summary: "List waste records" })
  @RequirePermissions("waste:read")
  async findRecords(@Query() query: WasteRecordQueryDto) {
    return this.wasteService.findRecords(query);
  }

  @Get("records/:id")
  @ApiOperation({ summary: "Get waste record" })
  @RequirePermissions("waste:read")
  async findRecordById(@Param("id") id: string) {
    return this.wasteService.findRecordById(id);
  }

  @Post("records")
  @RequirePermissions("waste:create")
  async createRecord(
    @Body() dto: CreateWasteRecordDto,
    @Req() req: AuthRequest,
  ) {
    return this.wasteService.createRecord(dto, req.user?.id);
  }

  @Patch("records/:id")
  @RequirePermissions("waste:update")
  async updateRecord(
    @Param("id") id: string,
    @Body() dto: UpdateWasteRecordDto,
  ) {
    return this.wasteService.updateRecord(id, dto);
  }

  @Delete("records/:id")
  @RequirePermissions("waste:delete")
  async deleteRecord(@Param("id") id: string) {
    await this.wasteService.deleteRecord(id);
    return { success: true };
  }

  @Patch("records/:id/approve")
  @RequirePermissions("waste:approve")
  async approveRecord(@Param("id") id: string, @Req() req: AuthRequest) {
    return this.wasteService.approveRecord(id, req.user?.id || "");
  }

  // === Monthly Reports ===

  @Get("reports/:projectId")
  @RequirePermissions("waste:read")
  async getMonthlyReports(@Param("projectId") projectId: string) {
    return this.wasteService.getMonthlyReports(projectId);
  }

  @Get("report/:id")
  @RequirePermissions("waste:read")
  async getMonthlyReportById(@Param("id") id: string) {
    return this.wasteService.getMonthlyReportById(id);
  }

  @Post("reports/generate")
  @RequirePermissions("waste:create")
  async generateMonthlyReport(@Body() dto: GenerateMonthlyReportDto) {
    return this.wasteService.generateMonthlyReport(dto);
  }

  @Patch("report/:id/submit")
  @RequirePermissions("waste:update")
  async submitMonthlyReport(
    @Param("id") id: string,
    @Body() dto: SubmitMonthlyReportDto,
  ) {
    return this.wasteService.submitMonthlyReport(id, dto.epaReportNumber);
  }

  // === Statistics ===

  @Get("statistics/:projectId")
  @RequirePermissions("waste:read")
  async getStatistics(
    @Param("projectId") projectId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.wasteService.getStatistics(projectId, startDate, endDate);
  }
}
