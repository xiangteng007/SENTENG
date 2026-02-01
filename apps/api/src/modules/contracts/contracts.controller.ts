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
import type { AuthenticatedRequest } from "../../common/types";
import type { Response } from "express";
import { ContractsService } from "./contracts.service";
import {
  CreateContractDto,
  UpdateContractDto,
  ConvertFromQuotationDto,
} from "./contract.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

@Controller("contracts")
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions("contracts:read")
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  async findAll(
    @Query("projectId") projectId?: string,
    @Query("status") status?: string,
  ) {
    return this.contractsService.findAll({ projectId, status });
  }

  /**
   * Export contracts to Excel/CSV
   * GET /api/v1/contracts/export/excel?format=xlsx|csv
   */
  @Get("export/excel")
  async exportExcel(
    @Query("projectId") projectId: string,
    @Query("status") status: string,
    @Query("format") format: "xlsx" | "csv",
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role;
    const buffer = await this.contractsService.exportToExcel(
      { projectId, status, format },
      userId,
      userRole,
    );

    const fileFormat = format || "xlsx";
    const filename = `contracts_${new Date().toISOString().slice(0, 10)}.${fileFormat}`;

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
  async findOne(@Param("id") id: string) {
    return this.contractsService.findOne(id);
  }

  @Post()
  async create(
    @Body() dto: CreateContractDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.contractsService.create(dto, req.user?.id);
  }

  @Post("from-quotation")
  async convertFromQuotation(
    @Body() dto: ConvertFromQuotationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.contractsService.convertFromQuotation(dto, req.user?.id);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateContractDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.contractsService.update(id, dto, req.user?.id);
  }

  @Post(":id/sign")
  async sign(
    @Param("id") id: string,
    @Body("signDate") signDate: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.contractsService.sign(id, signDate, req.user?.id);
  }

  @Post(":id/complete")
  async complete(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.contractsService.complete(id, req.user?.id);
  }

  @Post(":id/close")
  async close(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.contractsService.close(id, req.user?.id);
  }
}
