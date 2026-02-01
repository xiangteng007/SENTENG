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
import { InsuranceService } from "./insurance.service";
import {
  CreateInsuranceDto,
  UpdateInsuranceDto,
  InsuranceQueryDto,
  AddClaimDto,
} from "./insurance.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

@Controller("insurance")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get()
  @RequirePermissions("insurance:read")
  async findAll(@Query() query: InsuranceQueryDto) {
    return this.insuranceService.findAll(query);
  }

  @Get("expiring")
  @RequirePermissions("insurance:read")
  async getExpiring(@Query("days") days?: string) {
    const daysAhead = days ? parseInt(days, 10) : 30;
    return this.insuranceService.getExpiringInsurance(daysAhead);
  }

  @Get("rates")
  @RequirePermissions("insurance:read")
  async getRates(
    @Query("type") type?: string,
    @Query("constructionType") constructionType?: string,
  ) {
    return this.insuranceService.getRates(type, constructionType);
  }

  @Get("project/:projectId")
  @RequirePermissions("insurance:read")
  async findByProject(@Param("projectId") projectId: string) {
    return this.insuranceService.findByProject(projectId);
  }

  @Get(":id")
  @RequirePermissions("insurance:read")
  async findOne(@Param("id") id: string) {
    return this.insuranceService.findOne(id);
  }

  @Post()
  @RequirePermissions("insurance:create")
  async create(@Body() dto: CreateInsuranceDto) {
    return this.insuranceService.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("insurance:update")
  async update(@Param("id") id: string, @Body() dto: UpdateInsuranceDto) {
    return this.insuranceService.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("insurance:delete")
  async remove(@Param("id") id: string) {
    await this.insuranceService.remove(id);
    return { success: true };
  }

  // Claims endpoints
  @Post(":id/claims")
  @RequirePermissions("insurance:update")
  async addClaim(@Param("id") id: string, @Body() dto: AddClaimDto) {
    return this.insuranceService.addClaim(id, dto);
  }

  @Patch(":id/claims/:claimNumber/status")
  @RequirePermissions("insurance:update")
  async updateClaimStatus(
    @Param("id") id: string,
    @Param("claimNumber") claimNumber: string,
    @Body() body: { status: string; settledAmount?: number },
  ) {
    return this.insuranceService.updateClaimStatus(
      id,
      claimNumber,
      body.status as
        | "reported"
        | "under_review"
        | "approved"
        | "rejected"
        | "settled",
      body.settledAmount,
    );
  }
}
