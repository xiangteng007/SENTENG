import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { TenantsService } from "./tenants.service";
import {
  CreateLegalEntityDto,
  UpdateLegalEntityDto,
  CreateBusinessUnitDto,
  UpdateBusinessUnitDto,
} from "./dto/tenants.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";

@ApiTags("Platform - Tenants")
@ApiBearerAuth()
@Controller("platform/tenants")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ========== Legal Entities ==========

  @Get("legal-entities")
  @RequirePermissions("tenants:read")
  findAllLegalEntities() {
    return this.tenantsService.findAllLegalEntities();
  }

  @Get("legal-entities/:id")
  @RequirePermissions("tenants:read")
  findLegalEntityById(@Param("id") id: string) {
    return this.tenantsService.findLegalEntityById(id);
  }

  @Post("legal-entities")
  @RequirePermissions("tenants:admin")
  createLegalEntity(@Body() dto: CreateLegalEntityDto) {
    return this.tenantsService.createLegalEntity(dto);
  }

  @Patch("legal-entities/:id")
  @RequirePermissions("tenants:admin")
  updateLegalEntity(
    @Param("id") id: string,
    @Body() dto: UpdateLegalEntityDto,
  ) {
    return this.tenantsService.updateLegalEntity(id, dto);
  }

  // ========== Business Units ==========

  @Get("business-units")
  @RequirePermissions("tenants:read")
  findAllBusinessUnits(@Query("legalEntityId") legalEntityId?: string) {
    return this.tenantsService.findAllBusinessUnits(legalEntityId);
  }

  @Get("business-units/:id")
  @RequirePermissions("tenants:read")
  findBusinessUnitById(@Param("id") id: string) {
    return this.tenantsService.findBusinessUnitById(id);
  }

  @Post("business-units")
  @RequirePermissions("tenants:admin")
  createBusinessUnit(@Body() dto: CreateBusinessUnitDto) {
    return this.tenantsService.createBusinessUnit(dto);
  }

  @Patch("business-units/:id")
  @RequirePermissions("tenants:update")
  updateBusinessUnit(
    @Param("id") id: string,
    @Body() dto: UpdateBusinessUnitDto,
  ) {
    return this.tenantsService.updateBusinessUnit(id, dto);
  }

  // ========== Cost Centers ==========

  @Get("cost-centers")
  @RequirePermissions("tenants:read")
  findCostCenters(@Query("businessUnitId") businessUnitId: string) {
    return this.tenantsService.findCostCentersByBusinessUnit(businessUnitId);
  }
}
