import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../../../common/types";
import { ProcurementsService } from "./procurements.service";
import {
  CreateProcurementDto,
  UpdateProcurementDto,
  ProcurementQueryDto,
} from "./procurement.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";

@ApiTags("Procurements")
@ApiBearerAuth()
@Controller("procurements")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProcurementsController {
  constructor(private readonly procurementsService: ProcurementsService) {}

  @Get()
  @ApiOperation({ summary: "List procurements" })
  @RequirePermissions("procurements:read")
  findAll(@Query() query: ProcurementQueryDto) {
    return this.procurementsService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get procurement" })
  @RequirePermissions("procurements:read")
  findOne(@Param("id") id: string) {
    return this.procurementsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create procurement" })
  @RequirePermissions("procurements:create")
  create(
    @Body() dto: CreateProcurementDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.procurementsService.create(
      dto,
      req.user?.sub || req.user?.id,
    );
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update procurement" })
  @RequirePermissions("procurements:update")
  update(@Param("id") id: string, @Body() dto: UpdateProcurementDto) {
    return this.procurementsService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete procurement" })
  @RequirePermissions("procurements:delete")
  remove(@Param("id") id: string) {
    return this.procurementsService.remove(id);
  }
}
